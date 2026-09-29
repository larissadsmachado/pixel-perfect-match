import { BOARD_HEIGHT, BOARD_WIDTH, COOKIE_SIZE, SPRITES } from "@/data/gameConfig";
import type { GameCookieItem } from "@/types/game";

export function GameCookie({ cookie }: { cookie: GameCookieItem }) {
  return (
    <img
      src={cookie.type === "tradicional" ? SPRITES.tradicional : SPRITES.recheado}
      alt={cookie.type === "tradicional" ? "Cookie tradicional" : "Cookie recheado"}
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-sm"
      style={{
        left: `${(cookie.x / BOARD_WIDTH) * 100}%`,
        top: `${(cookie.y / BOARD_HEIGHT) * 100}%`,
        width: `${(COOKIE_SIZE / BOARD_WIDTH) * 100}%`,
      }}
    />
  );
}
