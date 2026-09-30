import { useCallback, useEffect, useRef, useState } from "react";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  COOKIE_SIZE,
  MAZE_MAPS,
  PLAYER_SIZE,
  PLAYER_SPEED,
  getMazeMap,
  MENU_URL,
} from "@/data/gameConfig";
import type { ChaserEnemy, Direction, GameCookieItem, MazeMap, Obstacle } from "@/types/game";
import { useGameControls } from "@/hooks/useGameControls";
import { GameCookie } from "./GameCookie";
import { GamePlayer } from "./GamePlayer";
import { GameChaser } from "./GameChaser";
import { GameHUD } from "./GameHUD";
import { GameControls } from "./GameControls";
import { GameEndScreen } from "./GameEndScreen";
import { CookieMatchGame } from "./CookieMatchGame";
import { RotateCcw, Map, Flame, Sparkles, ShoppingBag, UtensilsCrossed } from "lucide-react";

interface Crumb {
  id: number;
  x: number;
  y: number;
  points: number;
  text?: string;
}

const CELL_SIZE = 32;
const HALF = PLAYER_SIZE / 2;
const HIT_DISTANCE = CELL_SIZE * 0.85; // 27px hit distance guarantees 100% cookie reachability
const SAFE_ZONE_RADIUS = 70; // 70px radius safe zone around player spawn P

/** Precise bounding box wall collision check with 4px clearance */
function isCollidingWithWalls(x: number, y: number, obstacles: Obstacle[]): boolean {
  const margin = 4;
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

/** Check if position is inside player's Safe Spawn Zone */
function isInSafeZone(x: number, y: number, playerStart: { x: number; y: number }): boolean {
  return Math.hypot(x - playerStart.x, y - playerStart.y) < SAFE_ZONE_RADIUS;
}

/** BFS Pathfinding helper to calculate shortest corridor direction to target tile */
function getBFSDirection(
  rawGrid: string[],
  startC: number,
  startR: number,
  targetC: number,
  targetR: number,
  currentDir: Direction,
): Direction {
  const rows = rawGrid.length;
  const cols = rawGrid[0].length;
  if (startC === targetC && startR === targetR) return currentDir;

  const queue: Array<{ c: number; r: number; firstDir: Direction }> = [];
  const visited = new Set<string>();
  visited.add(`${startC},${startR}`);

  const dirs: Array<{ name: Direction; dc: number; dr: number }> = [
    { name: "up", dc: 0, dr: -1 },
    { name: "down", dc: 0, dr: 1 },
    { name: "left", dc: -1, dr: 0 },
    { name: "right", dc: 1, dr: 0 },
  ];

  for (const d of dirs) {
    const nc = startC + d.dc;
    const nr = startR + d.dr;
    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && rawGrid[nr][nc] !== "#") {
      if (nc === targetC && nr === targetR) return d.name;
      visited.add(`${nc},${nr}`);
      queue.push({ c: nc, r: nr, firstDir: d.name });
    }
  }

  while (queue.length > 0) {
    const { c, r, firstDir } = queue.shift()!;
    if (c === targetC && r === targetR) {
      return firstDir;
    }

    for (const d of dirs) {
      const nc = c + d.dc;
      const nr = r + d.dr;
      if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && rawGrid[nr][nc] !== "#") {
        const key = `${nc},${nr}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ c: nc, r: nr, firstDir });
        }
      }
    }
  }

  return currentDir;
}

/** Random valid corridor direction helper for wandering/patrolling AI */
function getRandomValidDirection(
  rawGrid: string[],
  startC: number,
  startR: number,
  currentDir: Direction,
): Direction {
  const rows = rawGrid.length;
  const cols = rawGrid[0].length;

  const opposite: Record<Direction, Direction> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  const dirs: Array<{ name: Direction; dc: number; dr: number }> = [
    { name: "up", dc: 0, dr: -1 },
    { name: "down", dc: 0, dr: 1 },
    { name: "left", dc: -1, dr: 0 },
    { name: "right", dc: 1, dr: 0 },
  ];

  const validDirs = dirs.filter((d) => {
    const nc = startC + d.dc;
    const nr = startR + d.dr;
    return nc >= 0 && nc < cols && nr >= 0 && nr < rows && rawGrid[nr][nc] !== "#";
  });

  if (validDirs.length === 0) return currentDir;

  // Prefer keeping current direction if valid (65% chance to maintain corridor momentum)
  const forwardValid = validDirs.some((d) => d.name === currentDir);
  if (forwardValid && Math.random() < 0.65) {
    return currentDir;
  }

  // Filter out immediate reverse if other choices exist
  const nonReverse = validDirs.filter((d) => d.name !== opposite[currentDir]);
  const choices = nonReverse.length > 0 ? nonReverse : validDirs;

  const choice = choices[Math.floor(Math.random() * choices.length)];
  return choice.name;
}

export function CookieGame() {
  const { pressed, active, press, release } = useGameControls();

  // Active Mini Game Selection: "caca" (Labirinto) or "monte" (Montar Cookie)
  const [activeTab, setActiveTab] = useState<"caca" | "monte">("caca");

  // Map state
  const [mapId, setMapId] = useState<string>(MAZE_MAPS[0].id);
  const currentMap = getMazeMap(mapId);
  const theme = currentMap.theme;

  // Game state
  const [lives, setLives] = useState(3);
  const [invulnerable, setInvulnerable] = useState(false);
  const invulnerableRef = useRef(false);

  // Super Mode (Power Pellet mode)
  const [superModeTime, setSuperModeTime] = useState(0);
  const superModeRef = useRef(false);

  // Position & Game refs
  const position = useRef({ ...currentMap.playerStart });
  const chasersRef = useRef<ChaserEnemy[]>([...currentMap.initialChasers]);
  const cookiesRef = useRef<GameCookieItem[]>([...currentMap.cookies]);
  const eatTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crumbId = useRef(0);
  const totalCookies = useRef(currentMap.cookies.length);
  const tickCount = useRef(0);

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
    superModeRef.current = false;
    setSuperModeTime(0);
    setDirection("right");
    setMoving(false);
  }, [mapId]);

  const handleMapChange = (id: string) => {
    setMapId(id);
    resetGame(id);
  };

  // Super Mode timer loop
  useEffect(() => {
    if (superModeTime <= 0) {
      superModeRef.current = false;
      return;
    }
    superModeRef.current = true;
    const timer = setInterval(() => {
      setSuperModeTime((t) => {
        if (t <= 1) {
          superModeRef.current = false;
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [superModeTime]);

  // Main game loop (for Labirinto game)
  useEffect(() => {
    if (activeTab !== "caca") return;
    let frame = 0;

    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (finished) return;

      tickCount.current++;
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

        // Smooth Corner Alignment / Axis Nudging towards OPEN passages
        let tryX = curr.x;
        let tryY = curr.y;

        if (dy !== 0 && dx === 0) {
          const colCenter = Math.floor(curr.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
          const diffX = colCenter - curr.x;
          if (Math.abs(diffX) < 14) {
            if (!isCollidingWithWalls(colCenter, curr.y + dy, obstacles)) {
              tryX += Math.sign(diffX) * Math.min(PLAYER_SPEED, Math.abs(diffX));
            }
          }
          tryY += dy;
        } else if (dx !== 0 && dy === 0) {
          const rowCenter = Math.floor(curr.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
          const diffY = rowCenter - curr.y;
          if (Math.abs(diffY) < 14) {
            if (!isCollidingWithWalls(curr.x + dx, rowCenter, obstacles)) {
              tryY += Math.sign(diffY) * Math.min(PLAYER_SPEED, Math.abs(diffY));
            }
          }
          tryX += dx;
        } else {
          tryX += dx;
          tryY += dy;
        }

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
      const playerStart = currentMap.playerStart;
      const obstacles = currentMap.obstacles;
      const isSuperMode = superModeRef.current;

      const isScatterPhase = (tickCount.current % 600) > 420;

      const pCol = Math.floor(currPlayerPos.x / CELL_SIZE);
      const pRow = Math.floor(currPlayerPos.y / CELL_SIZE);

      const updatedChasers = chasersRef.current.map((chaser) => {
        let { x, y, direction: cDir, speed } = chaser;
        const cCol = Math.floor(x / CELL_SIZE);
        const cRow = Math.floor(y / CELL_SIZE);

        const currentSpeed = isSuperMode ? speed * 0.75 : speed;

        const distToPlayer = Math.hypot(x - currPlayerPos.x, y - currPlayerPos.y);
        const DETECT_RADIUS = 160; // Proximity detection threshold (in pixels)

        const isAtCenter =
          Math.abs((x - CELL_SIZE / 2) % CELL_SIZE) < 3 &&
          Math.abs((y - CELL_SIZE / 2) % CELL_SIZE) < 3;

        if (isAtCenter && currentMap.rawGrid) {
          if (isSuperMode) {
            const spawnC = Math.floor(chaser.spawnX / CELL_SIZE);
            const spawnR = Math.floor(chaser.spawnY / CELL_SIZE);
            cDir = getBFSDirection(currentMap.rawGrid, cCol, cRow, spawnC, spawnR, cDir);
          } else if (distToPlayer <= DETECT_RADIUS && !isScatterPhase) {
            // Player is close! Active BFS chase
            cDir = getBFSDirection(currentMap.rawGrid, cCol, cRow, pCol, pRow, cDir);
          } else {
            // Player is far away: Wander freely through corridors (distractible)
            cDir = getRandomValidDirection(currentMap.rawGrid, cCol, cRow, cDir);
          }
        }

        let nx = x;
        let ny = y;
        if (cDir === "left") nx -= currentSpeed;
        if (cDir === "right") nx += currentSpeed;
        if (cDir === "up") ny -= currentSpeed;
        if (cDir === "down") ny += currentSpeed;

        const enteringSafeZone = isInSafeZone(nx, ny, playerStart);

        if (!isCollidingWithWalls(nx, ny, obstacles) && !enteringSafeZone) {
          x = nx;
          y = ny;
        }

        return { ...chaser, x, y, direction: cDir, isScared: isSuperMode };
      });

      chasersRef.current = updatedChasers;
      setChasers(updatedChasers);

      // Check Chaser-Player Collision
      for (let i = 0; i < updatedChasers.length; i++) {
        const chaser = updatedChasers[i];
        const dist = Math.hypot(chaser.x - currPlayerPos.x, chaser.y - currPlayerPos.y);

        if (dist < 18) {
          if (isSuperMode) {
            setScore((s) => s + 200);
            triggerEat();

            const id = ++crumbId.current;
            setCrumbs((cs) => [
              ...cs,
              { id, x: chaser.x, y: chaser.y, points: 200, text: "DELÍCIA! +200" },
            ]);
            setTimeout(() => setCrumbs((cs) => cs.filter((c) => c.id !== id)), 800);

            chasersRef.current[i] = {
              ...chaser,
              x: chaser.spawnX,
              y: chaser.spawnY,
            };
            setChasers([...chasersRef.current]);
          } else if (!invulnerableRef.current) {
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

            position.current = { ...currentMap.playerStart };
            setPlayer({ ...currentMap.playerStart });

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

        if (hit.type === "super") {
          setSuperModeTime(7);
          superModeRef.current = true;
        }

        const id = ++crumbId.current;
        const text = hit.type === "super" ? "SUPER COOKIE! +50" : `nhac! +${hit.points}`;
        setCrumbs((cs) => [...cs, { id, x: hit.x, y: hit.y, points: hit.points, text }]);
        setTimeout(() => setCrumbs((cs) => cs.filter((c) => c.id !== id)), 700);

        if (cookiesRef.current.length === 0) {
          setVictory(true);
          setFinished(true);
        }
      }
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [pressed, triggerEat, finished, currentMap.obstacles, currentMap.playerStart, currentMap.rawGrid, activeTab]);

  useEffect(
    () => () => {
      if (eatTimeout.current) clearTimeout(eatTimeout.current);
    },
    [],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-2">
      {/* Mini Games Arcade Selector Header Tabs */}
      <div className="flex w-full items-center justify-between gap-2 rounded-3xl border border-border bg-card p-2 shadow-sm">
        <div className="flex flex-1 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("caca")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-black transition-all ${
              activeTab === "caca"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
            }`}
          >
            <span>🍪 Caça aos Cookies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("monte")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-black transition-all ${
              activeTab === "monte"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
            }`}
          >
            <Sparkles className="size-4 text-amber-400" />
            <span>🍬 Doces Match (Candy Crush)</span>
          </button>
        </div>

        <a
          href={MENU_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-2xl border border-border bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground hover:bg-accent transition-colors"
        >
          <ShoppingBag className="size-3.5 text-primary" />
          <span className="hidden sm:inline">Ver Cookies</span>
        </a>
      </div>

      {/* GAME 1: Caça aos Cookies (Labirinto) */}
      {activeTab === "caca" && (
        <>
          {/* Game HUD */}
          <GameHUD
            score={score}
            remaining={cookies.length}
            collected={totalCookies.current - cookies.length}
            total={totalCookies.current}
            mapName={currentMap.name}
            lives={lives}
          />

          {/* Super Mode Indicator Banner */}
          {superModeTime > 0 && (
            <div className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-primary to-orange-500 p-2 text-center text-xs font-black text-white shadow-md animate-bounce flex items-center justify-center gap-2">
              <Sparkles className="size-4 animate-spin" />
              <span>SUPER MODO CONFEITEIRO INVENCÍVEL! COMA OS CONFEITOS! ({superModeTime}s)</span>
            </div>
          )}

          {/* Game Board Container */}
          <div
            className="relative w-full overflow-hidden rounded-3xl border-2 border-border shadow-xl select-none touch-none transition-colors duration-300"
            style={{
              aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
              backgroundColor: theme.boardBg,
              backgroundImage: `radial-gradient(color-mix(in oklab, ${theme.boardPattern} 50%, transparent) 1.5px, transparent 1.6px)`,
              backgroundSize: "24px 24px",
            }}
          >
            {/* Outer dotted border */}
            <div className="pointer-events-none absolute inset-2 rounded-2xl border-2 border-dashed border-foreground/15" />

            {/* Maze Walls */}
            {currentMap.obstacles.map((obs, idx) => (
              <div
                key={idx}
                className={`absolute rounded-lg border bg-gradient-to-br transition-all ${theme.wallGradient} ${theme.wallBorder} ${theme.wallShadow}`}
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

            {/* Chaser Enemies */}
            {chasers.map((chaser) => (
              <GameChaser key={chaser.id} chaser={chaser} />
            ))}

            {/* Floating crumbs text */}
            {crumbs.map((crumb) => (
              <span
                key={crumb.id}
                className="animate-crumb pointer-events-none absolute font-black text-xs sm:text-sm text-primary drop-shadow-md z-10"
                style={{
                  left: `${(crumb.x / BOARD_WIDTH) * 100}%`,
                  top: `${(crumb.y / BOARD_HEIGHT) * 100}%`,
                }}
              >
                {crumb.text || `nhac! +${crumb.points}`}
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
                onOpenRanking={() => {}}
                onOpenAuth={() => {}}
                user={null}
              />
            )}
          </div>

          {/* Controls & Map Switcher */}
          <div className="flex w-full flex-col items-center gap-3">
            <GameControls onPress={press} onRelease={release} active={active} />

            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1 text-xs shadow-sm">
                <Map className="size-3.5 text-muted-foreground ml-2" />
                {MAZE_MAPS.map((m) => {
                  const isSelected = mapId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleMapChange(m.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {m.id === "cozinha-encantada" && <Flame className="size-3.5 text-amber-400" />}
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => resetGame()}
                className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-secondary active:scale-95 shadow-sm"
              >
                <RotateCcw className="size-3.5" />
                <span>Reiniciar fase</span>
              </button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground max-w-md">
              🍪 No computador use as <strong>setas</strong> ou <strong>W, A, S, D</strong>. No celular use os botões direcionais na tela.
            </p>
          </div>
        </>
      )}

      {/* GAME 2: Candy Crush Match-3 (Doces Match Magisserie) */}
      {activeTab === "monte" && <CookieMatchGame />}
    </div>
  );
}
