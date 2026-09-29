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
import type { Direction, GameCookieItem, MazeMap, Obstacle } from "@/types/game";
import { useGameControls } from "@/hooks/useGameControls";
import { GameCookie } from "./GameCookie";
import { GamePlayer } from "./GamePlayer";
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

/** Wall collision check with bounding box collision */
function isCollidingWithWalls(x: number, y: number, obstacles: Obstacle[]): boolean {
  const margin = 1;
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

export function CookieGame() {
  const { pressed, active, press, release } = useGameControls();

  // Modals & User state
  const [user, setUser] = useState<User | null>(null);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Map state
  const [mapId, setMapId] = useState<string>(MAZE_MAPS[0].id);
  const currentMap: MazeMap = getMazeMap(mapId);

  // Position & Game refs
  const position = useRef({ ...currentMap.playerStart });
  const cookiesRef = useRef<GameCookieItem[]>([...currentMap.cookies]);
  const eatTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crumbId = useRef(0);
  const totalCookies = useRef(currentMap.cookies.length);

  // Game UI state
  const [player, setPlayer] = useState({ ...currentMap.playerStart });
  const [direction, setDirection] = useState<Direction>("right");
  const [moving, setMoving] = useState(false);
  const [eating, setEating] = useState(false);
  const [cookies, setCookies] = useState<GameCookieItem[]>([...currentMap.cookies]);
  const [score, setScore] = useState(0);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [finished, setFinished] = useState(false);

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
    totalCookies.current = selectedMap.cookies.length;

    setPlayer({ ...selectedMap.playerStart });
    setCookies([...selectedMap.cookies]);
    setScore(0);
    setCrumbs([]);
    setEating(false);
    setFinished(false);
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

        // X axis collision check
        let nextX = Math.min(BOARD_WIDTH - HALF, Math.max(HALF, curr.x + dx));
        if (isCollidingWithWalls(nextX, curr.y, obstacles)) {
          nextX = curr.x;
        }

        // Y axis collision check
        let nextY = Math.min(BOARD_HEIGHT - HALF, Math.max(HALF, curr.y + dy));
        if (isCollidingWithWalls(nextX, nextY, obstacles)) {
          nextY = curr.y;
        }

        const next = { x: nextX, y: nextY };
        position.current = next;
        setPlayer(next);
      }

      // Check cookie eating collision
      const currPos = position.current;
      const hitIndex = cookiesRef.current.findIndex(
        (c) => Math.hypot(c.x - currPos.x, c.y - currPos.y) < HIT_DISTANCE,
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
          setFinished(true);
        }
      }
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [pressed, triggerEat, finished, currentMap.obstacles]);

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

        {/* Maze Walls (Paredes do Labirinto) */}
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
        <GamePlayer
          x={player.x}
          y={player.y}
          direction={direction}
          eating={eating}
          moving={moving}
        />

        {/* Game End Screen Dialog */}
        {finished && (
          <GameEndScreen
            score={score}
            totalCookies={totalCookies.current}
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
          💡 No computador use as <strong>setas</strong> ou <strong>W, A, S, D</strong>. No celular segure os botões direcionais para andar continuamente.
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
