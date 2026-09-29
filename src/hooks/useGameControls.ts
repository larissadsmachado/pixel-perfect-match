import { useCallback, useEffect, useRef, useState } from "react";
import type { Direction } from "@/types/game";

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

/**
 * Tracks which directions are currently held, from keyboard and touch.
 * Returns a ref (for the game loop) plus setters for the touch buttons.
 */
export function useGameControls() {
  const pressed = useRef<Set<Direction>>(new Set());
  const [active, setActive] = useState<Direction[]>([]);

  const sync = useCallback(() => {
    setActive(Array.from(pressed.current));
  }, []);

  const press = useCallback(
    (dir: Direction) => {
      pressed.current.add(dir);
      sync();
    },
    [sync],
  );

  const release = useCallback(
    (dir: Direction) => {
      pressed.current.delete(dir);
      sync();
    },
    [sync],
  );

  const releaseAll = useCallback(() => {
    pressed.current.clear();
    sync();
  }, [sync]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key] ?? KEY_MAP[e.key.toLowerCase()];
      if (!dir) return;
      e.preventDefault();
      press(dir);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key] ?? KEY_MAP[e.key.toLowerCase()];
      if (!dir) return;
      release(dir);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseAll);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseAll);
    };
  }, [press, release, releaseAll]);

  return { pressed, active, press, release, releaseAll };
}
