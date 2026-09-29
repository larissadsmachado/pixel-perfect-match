import { useCallback, useEffect, useRef, useState } from "react";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  COOKIE_SIZE,
  OBSTACLES,
  PLAYER_SIZE,
  PLAYER_SPEED,
  START_POSITION,
  createCookies,
} from "@/data/gameConfig";
import type { Direction, GameCookieItem } from "@/types/game";
import { useGameControls } from "@/hooks/useGameControls";
import { GameCookie } from "./GameCookie";
import { GamePlayer } from "./GamePlayer";
import { GameHUD } from "./GameHUD";
import { GameControls } from "./GameControls";
import { GameEndScreen } from "./GameEndScreen";

interface Crumb {
  id: number;
  x: number;
  y: number;
  points: number;
}

const HALF = PLAYER_SIZE / 2;
const HIT_DISTANCE = (PLAYER_SIZE + COOKIE_SIZE) / 2.6;

function blocked(x: number, y: number) {
  return OBSTACLES.some(
    (o) =>
      x + HALF > o.x &&
      x - HALF < o.x + o.width &&
      y + HALF > o.y &&
      y - HALF < o.y + o.height,
  );
}

export function CookieGame() {
  const { pressed, active, press, release } = useGameControls();

  const position = useRef({ ...START_POSITION });
  const cookiesRef = useRef<GameCookieItem[]>(createCookies());
  const eatTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crumbId = useRef(0);
  const total = useRef(cookiesRef.current.length).current;

  const [player, setPlayer] = useState({ ...START_POSITION });
  const [direction, setDirection] = useState<Direction>("right");
  const [moving, setMoving] = useState(false);
  const [eating, setEating] = useState(false);
  const [cookies, setCookies] = useState<GameCookieItem[]>(cookiesRef.current);
  const [score, setScore] = useState(0);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [finished, setFinished] = useState(false);

  const triggerEat = useCallback(() => {
    setEating(true);
    if (eatTimeout.current) clearTimeout(eatTimeout.current);
    eatTimeout.current = setTimeout(() => setEating(false), 260);
  }, []);

  useEffect(() => {
    let frame = 0;

    const loop = () => {
      frame = requestAnimationFrame(loop);
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
        else setDirection("down");

        const next = { ...position.current };
        const tryX = Math.min(BOARD_WIDTH - HALF, Math.max(HALF, next.x + dx));
        if (!blocked(tryX, next.y)) next.x = tryX;
        const tryY = Math.min(BOARD_HEIGHT - HALF, Math.max(HALF, next.y + dy));
        if (!blocked(next.x, tryY)) next.y = tryY;

        position.current = next;
        setPlayer(next);
      }

      // collision with cookies
      const hit = cookiesRef.current.find(
        (c) => Math.hypot(c.x - position.current.x, c.y - position.current.y) < HIT_DISTANCE,
      );
      if (hit) {
        cookiesRef.current = cookiesRef.current.filter((c) => c.id !== hit.id);
        setCookies(cookiesRef.current);
        setScore((s) => s + hit.points);
        triggerEat();
        const id = ++crumbId.current;
        setCrumbs((cs) => [...cs, { id, x: hit.x, y: hit.y, points: hit.points }]);
        setTimeout(() => setCrumbs((cs) => cs.filter((c) => c.id !== id)), 600);
        if (cookiesRef.current.length === 0) setFinished(true);
      }
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [pressed, triggerEat]);

  useEffect(
    () => () => {
      if (eatTimeout.current) clearTimeout(eatTimeout.current);
    },
    [],
  );

  const restart = useCallback(() => {
    position.current = { ...START_POSITION };
    cookiesRef.current = createCookies();
    setPlayer({ ...START_POSITION });
    setCookies(cookiesRef.current);
    setScore(0);
    setCrumbs([]);
    setEating(false);
    setFinished(false);
    setDirection("right");
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
      <GameHUD
        score={score}
        remaining={cookies.length}
        collected={total - cookies.length}
        total={total}
      />

      <div
        className="relative w-full overflow-hidden rounded-3xl border border-border bg-board shadow-[var(--shadow-soft)]"
        style={{
          aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--board-pattern) 60%, transparent) 1.5px, transparent 1.6px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-dashed border-border/70" />

        {cookies.map((cookie) => (
          <GameCookie key={cookie.id} cookie={cookie} />
        ))}

        {crumbs.map((crumb) => (
          <span
            key={crumb.id}
            className="animate-crumb pointer-events-none absolute text-sm font-bold text-primary"
            style={{
              left: `${(crumb.x / BOARD_WIDTH) * 100}%`,
              top: `${(crumb.y / BOARD_HEIGHT) * 100}%`,
            }}
          >
            nhac! +{crumb.points}
          </span>
        ))}

        <GamePlayer
          x={player.x}
          y={player.y}
          direction={direction}
          eating={eating}
          moving={moving}
        />

        {finished && <GameEndScreen score={score} onRestart={restart} />}
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <GameControls onPress={press} onRelease={release} active={active} />
        <p className="text-center text-xs text-muted-foreground">
          No computador use as setas ou W, A, S, D. No celular use os botões acima.
        </p>
        <button
          type="button"
          onClick={restart}
          className="rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Reiniciar jogo
        </button>
      </div>
    </div>
  );
}
