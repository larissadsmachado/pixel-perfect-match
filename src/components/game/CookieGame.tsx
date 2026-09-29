import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  COOKIE_SIZE,
  MAZE_MAPS,
  PLAYER_SIZE,
  PLAYER_SPEED,
  getMazeMap,
} from "@/data/gameConfig";
import type { ChaserEnemy, Direction, GameCookieItem, MazeMap, Obstacle } from "@/types/game";
import { useGameControls } from "@/hooks/useGameControls";
import { GameCookie } from "./GameCookie";
import { GamePlayer } from "./GamePlayer";
import { GameChaser } from "./GameChaser";
import { GameHUD } from "./GameHUD";
import { GameControls } from "./GameControls";
import { GameEndScreen } from "./GameEndScreen";
import { UserBar } from "@/components/auth/UserBar";
import { RankingModal } from "./RankingModal";
import { CouponsModal } from "./CouponsModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { RotateCcw, Map } from "lucide-react";

interface Crumb {
  id: number;
  x: number;
  y: number;
  points: number;
}

const HALF = PLAYER_SIZE / 2;
const HIT_DISTANCE = (PLAYER_SIZE + COOKIE_SIZE) / 2.2;
const CELL_SIZE = 32;

/** Precise bounding box wall collision check */
function isCollidingWithWalls(x: number, y: number, obstacles: Obstacle[]): boolean {
  const margin = 2;
  const left = x - HALF + margin;
  const right = x + HALF - margin;
  const top = y - HALF + margin;
  const bottom = y + HALF - margin;

  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    const oRight = o.x + o.width;
    const oBottom = o.y + o.height;

    if (left < oRight && right > o.x && top < oBottom && bottom > o.y) {
      return true;
    }
  }

  return false;
}

/** Get valid corridor directions for a position */
function getValidDirections(x: number, y: number, obstacles: Obstacle[]): Direction[] {
  const directions: Direction[] = ["up", "down", "left", "right"];
  const step = 6;
  const valid: Direction[] = [];

  for (const dir of directions) {
    let nx = x;
    let ny = y;
    if (dir === "left") nx -= step;
    if (dir === "right") nx += step;
    if (dir === "up") ny -= step;
    if (dir === "down") ny += step;

    if (!isCollidingWithWalls(nx, ny, obstacles)) {
      valid.push(dir);
    }
  }

  return valid;
}

export function CookieGame() {
  const { pressed, active, press, release } = useGameControls();

  // Modals & User state
  const [user, setUser] = useState<User | null>(null);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Map state
  const [mapId, setMapId] = useState<string>(MAZE_MAPS[0].id);
  const currentMap = getMazeMap(mapId);

  // Game state
  const [lives, setLives] = useState(3);
  const [invulnerable, setInvulnerable] = useState(false);
  const invulnerableRef = useRef(false);

  // Position & Game refs
  const position = useRef({ ...currentMap.playerStart });
  const chasersRef = useRef<ChaserEnemy[]>([...currentMap.initialChasers]);
  const cookiesRef = useRef<GameCookieItem[]>([...currentMap.cookies]);
  const eatTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crumbId = useRef(0);
  const totalCookies = useRef(currentMap.cookies.length);

  // Game UI state
  const [player, setPlayer] = useState({ ...currentMap.playerStart });
  const [chasers, setChasers] = useState<ChaserEnemy[]>([...currentMap.initialChasers]);
  const [direction, setDirection] = useState<Direction>("right");
  const [moving, setMoving] = useState(false);
  const [eating, setEating] = useState(false);
  const [cookies, setCookies] = useState<GameCookieItem[]>([...currentMap.cookies]);
  const [score, setScore] = useState(0);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [finished, setFinished] = useState(false);
  const [victory, setVictory] = useState(true);

  const triggerEat = useCallback(() => {
    setEating(true);
    if (eatTimeout.current) clearTimeout(eatTimeout.current);
    eatTimeout.current = setTimeout(() => setEating(false), 280);
  }, []);

  const resetGame = useCallback((newMapId?: string) => {
    const targetMapId = newMapId || mapId;
    const selectedMap = getMazeMap(targetMapId);

    position.current = { ...selectedMap.playerStart };
    cookiesRef.current = [...selectedMap.cookies];
    chasersRef.current = [...selectedMap.initialChasers];
    totalCookies.current = selectedMap.cookies.length;

    setPlayer({ ...selectedMap.playerStart });
    setChasers([...selectedMap.initialChasers]);
    setCookies([...selectedMap.cookies]);
    setScore(0);
    setCrumbs([]);
    setEating(false);
    setFinished(false);
    setVictory(true);
    setLives(3);
    setInvulnerable(false);
    invulnerableRef.current = false;
    setDirection("right");
    setMoving(false);
  }, [mapId]);

  const handleMapChange = (id: string) => {
    setMapId(id);
    resetGame(id);
  };

  // Main game loop
  useEffect(() => {
    let frame = 0;

    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (finished) return;

      const keys = pressed.current;

      let dx = 0;
      let dy = 0;
      if (keys.has("left")) dx -= PLAYER_SPEED;
      if (keys.has("right")) dx += PLAYER_SPEED;
      if (keys.has("up")) dy -= PLAYER_SPEED;
      if (keys.has("down")) dy += PLAYER_SPEED;

      const isMoving = dx !== 0 || dy !== 0;
      setMoving(isMoving);

      if (isMoving) {
        if (dx < 0) setDirection("left");
        else if (dx > 0) setDirection("right");
        else if (dy < 0) setDirection("up");
        else if (dy > 0) setDirection("down");

        const curr = position.current;
        const obstacles = currentMap.obstacles;

        // Smooth Corner Alignment / Axis Nudging
        let tryX = curr.x;
        let tryY = curr.y;

        if (dy !== 0 && dx === 0) {
          // Moving vertically: align X to closest grid cell center for smooth turn
          const colCenter = Math.floor(curr.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
          const diffX = colCenter - curr.x;
          if (Math.abs(diffX) < 14) {
            tryX += Math.sign(diffX) * Math.min(PLAYER_SPEED, Math.abs(diffX));
          }
          tryY += dy;
        } else if (dx !== 0 && dy === 0) {
          // Moving horizontally: align Y to closest grid cell center for smooth turn
          const rowCenter = Math.floor(curr.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
          const diffY = rowCenter - curr.y;
          if (Math.abs(diffY) < 14) {
            tryY += Math.sign(diffY) * Math.min(PLAYER_SPEED, Math.abs(diffY));
          }
          tryX += dx;
        } else {
          tryX += dx;
          tryY += dy;
        }

        // Bound checks & collision checks
        const clampedX = Math.min(BOARD_WIDTH - HALF, Math.max(HALF, tryX));
        const clampedY = Math.min(BOARD_HEIGHT - HALF, Math.max(HALF, tryY));

        let finalX = curr.x;
        let finalY = curr.y;

        if (!isCollidingWithWalls(clampedX, curr.y, obstacles)) {
          finalX = clampedX;
        }
        if (!isCollidingWithWalls(finalX, clampedY, obstacles)) {
          finalY = clampedY;
        }

        const next = { x: finalX, y: finalY };
        position.current = next;
        setPlayer(next);
      }

      // Update Chasers AI Movement
      const currPlayerPos = position.current;
      const obstacles = currentMap.obstacles;

      const updatedChasers = chasersRef.current.map((chaser) => {
        let { x, y, direction: cDir, speed } = chaser;

        // Check if chaser is near center of grid cell
        const isAtCenter =
          Math.abs((x - CELL_SIZE / 2) % CELL_SIZE) < 3 &&
          Math.abs((y - CELL_SIZE / 2) % CELL_SIZE) < 3;

        const validDirs = getValidDirections(x, y, obstacles);

        if (validDirs.length > 0) {
          if (isAtCenter || !validDirs.includes(cDir)) {
            // Filter out opposite direction unless dead end
            const opposite: Record<Direction, Direction> = {
              up: "down",
              down: "up",
              left: "right",
              right: "left",
            };
            const nonOpposite = validDirs.filter((d) => d !== opposite[cDir]);
            const choices = nonOpposite.length > 0 ? nonOpposite : validDirs;

            // 60% chance to chase player direction, 40% random choice
            if (Math.random() < 0.6) {
              const bestDir = choices.reduce((best, candidate) => {
                let testX = x;
                let testY = y;
                if (candidate === "left") testX -= 10;
                if (candidate === "right") testX += 10;
                if (candidate === "up") testY -= 10;
                if (candidate === "down") testY += 10;

                const distToPlayer = Math.hypot(testX - currPlayerPos.x, testY - currPlayerPos.y);
                const bestDist = Math.hypot(
                  (best === "left" ? x - 10 : best === "right" ? x + 10 : x) - currPlayerPos.x,
                  (best === "up" ? y - 10 : best === "down" ? y + 10 : y) - currPlayerPos.y,
                );
                return distToPlayer < bestDist ? candidate : best;
              }, choices[0]);

              cDir = bestDir;
            } else {
              cDir = choices[Math.floor(Math.random() * choices.length)];
            }
          }
        }

        let nx = x;
        let ny = y;
        if (cDir === "left") nx -= speed;
        if (cDir === "right") nx += speed;
        if (cDir === "up") ny -= speed;
        if (cDir === "down") ny += speed;

        if (!isCollidingWithWalls(nx, ny, obstacles)) {
          x = nx;
          y = ny;
        }

        return { ...chaser, x, y, direction: cDir };
      });

      chasersRef.current = updatedChasers;
      setChasers(updatedChasers);

      // Check Chaser-Player Collision
      if (!invulnerableRef.current) {
        for (const chaser of updatedChasers) {
          const dist = Math.hypot(chaser.x - currPlayerPos.x, chaser.y - currPlayerPos.y);
          if (dist < 18) {
            // Player caught by bakery chaser!
            invulnerableRef.current = true;
            setInvulnerable(true);

            setLives((l) => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setVictory(false);
                setFinished(true);
              }
              return newLives;
            });

            // Reset player to start position
            position.current = { ...currentMap.playerStart };
            setPlayer({ ...currentMap.playerStart });

            // Clear invulnerability after 1.8s
            setTimeout(() => {
              invulnerableRef.current = false;
              setInvulnerable(false);
            }, 1800);

            break;
          }
        }
      }

      // Check cookie eating collision
      const hitIndex = cookiesRef.current.findIndex(
        (c) => Math.hypot(c.x - currPlayerPos.x, c.y - currPlayerPos.y) < HIT_DISTANCE,
      );

      if (hitIndex !== -1) {
        const hit = cookiesRef.current[hitIndex];
        cookiesRef.current = cookiesRef.current.filter((_, idx) => idx !== hitIndex);
        setCookies([...cookiesRef.current]);
        setScore((s) => s + hit.points);
        triggerEat();

        const id = ++crumbId.current;
        setCrumbs((cs) => [...cs, { id, x: hit.x, y: hit.y, points: hit.points }]);
        setTimeout(() => setCrumbs((cs) => cs.filter((c) => c.id !== id)), 650);

        if (cookiesRef.current.length === 0) {
          setVictory(true);
          setFinished(true);
        }
      }
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [pressed, triggerEat, finished, currentMap.obstacles, currentMap.playerStart]);

  useEffect(
    () => () => {
      if (eatTimeout.current) clearTimeout(eatTimeout.current);
    },
    [],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-2">
      {/* User Bar / Header */}
      <UserBar
        onOpenRanking={() => setRankingOpen(true)}
        onOpenCoupons={() => setCouponsOpen(true)}
        user={user}
        setUser={setUser}
      />

      {/* Game HUD */}
      <GameHUD
        score={score}
        remaining={cookies.length}
        collected={totalCookies.current - cookies.length}
        total={totalCookies.current}
        mapName={currentMap.name}
        lives={lives}
      />

      {/* Game Board Container */}
      <div
        className="relative w-full overflow-hidden rounded-3xl border-2 border-border bg-board shadow-[var(--shadow-soft)] select-none touch-none"
        style={{
          aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--board-pattern) 50%, transparent) 1.5px, transparent 1.6px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Outer dotted border */}
        <div className="pointer-events-none absolute inset-2 rounded-2xl border-2 border-dashed border-border/60" />

        {/* Maze Walls (Paredes do Labirinto da Confeitaria) */}
        {currentMap.obstacles.map((obs, idx) => (
          <div
            key={idx}
            className="absolute rounded-lg border border-primary/20 bg-gradient-to-br from-[#21687a] to-[#184e5b] shadow-sm transition-all"
            style={{
              left: `${(obs.x / BOARD_WIDTH) * 100}%`,
              top: `${(obs.y / BOARD_HEIGHT) * 100}%`,
              width: `${(obs.width / BOARD_WIDTH) * 100}%`,
              height: `${(obs.height / BOARD_HEIGHT) * 100}%`,
            }}
          />
        ))}

        {/* Cookies */}
        {cookies.map((cookie) => (
          <GameCookie key={cookie.id} cookie={cookie} />
        ))}

        {/* Chaser Enemies (Fantasminhas / Confeitos Encantados) */}
        {chasers.map((chaser) => (
          <GameChaser key={chaser.id} chaser={chaser} />
        ))}

        {/* Floating "+10 nhac!" crumbs */}
        {crumbs.map((crumb) => (
          <span
            key={crumb.id}
            className="animate-crumb pointer-events-none absolute font-black text-xs sm:text-sm text-primary drop-shadow-md z-10"
            style={{
              left: `${(crumb.x / BOARD_WIDTH) * 100}%`,
              top: `${(crumb.y / BOARD_HEIGHT) * 100}%`,
            }}
          >
            nhac! +{crumb.points}
          </span>
        ))}

        {/* Mascot / Player */}
        <div className={invulnerable ? "animate-pulse opacity-60" : ""}>
          <GamePlayer
            x={player.x}
            y={player.y}
            direction={direction}
            eating={eating}
            moving={moving}
          />
        </div>

        {/* Game End Screen Dialog */}
        {finished && (
          <GameEndScreen
            score={score}
            cookiesCollected={totalCookies.current - cookies.length}
            totalCookies={totalCookies.current}
            victory={victory}
            onRestart={() => resetGame()}
            onOpenRanking={() => setRankingOpen(true)}
            onOpenAuth={() => setAuthOpen(true)}
            user={user}
          />
        )}
      </div>

      {/* Controls & Map Switcher */}
      <div className="flex w-full flex-col items-center gap-3">
        <GameControls onPress={press} onRelease={release} active={active} />

        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {/* Map selector button */}
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1 text-xs">
            <Map className="size-3.5 text-muted-foreground ml-2" />
            {MAZE_MAPS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMapChange(m.id)}
                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                  mapId === m.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => resetGame()}
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-secondary active:scale-95"
          >
            <RotateCcw className="size-3.5" />
            <span>Reiniciar fase</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground max-w-md">
          💡 Cuidado com os <strong>Confeitos Encantados 🧁</strong>! No computador use as <strong>setas</strong> ou <strong>W, A, S, D</strong>. No celular segure os botões direcionais para andar continuamente.
        </p>
      </div>

      {/* Modals */}
      <RankingModal
        isOpen={rankingOpen}
        onClose={() => setRankingOpen(false)}
        currentUserId={user?.id}
      />

      <CouponsModal
        isOpen={couponsOpen}
        onClose={() => setCouponsOpen(false)}
        userId={user?.id}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
    </div>
  );
}
