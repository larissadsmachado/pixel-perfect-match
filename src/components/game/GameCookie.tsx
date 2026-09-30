import { BOARD_HEIGHT, BOARD_WIDTH, COOKIE_SIZE, SPRITES } from "@/data/gameConfig";
import type { GameCookieItem } from "@/types/game";

export function GameCookie({ cookie }: { cookie: GameCookieItem }) {
  const isSuper = cookie.type === "super";
  const size = isSuper ? COOKIE_SIZE * 1.5 : COOKIE_SIZE;

  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none"
      style={{
        left: `${(cookie.x / BOARD_WIDTH) * 100}%`,
        top: `${(cookie.y / BOARD_HEIGHT) * 100}%`,
        width: `${(size / BOARD_WIDTH) * 100}%`,
      }}
    >
      <img
        src={cookie.type === "tradicional" ? SPRITES.tradicional : SPRITES.recheado}
        alt={isSuper ? "Super Cookie Recheado" : cookie.type === "tradicional" ? "Cookie tradicional" : "Cookie recheado"}
        className={`size-full drop-shadow-sm transition-transform ${
          isSuper ? "animate-bounce scale-110 drop-shadow-[0_0_8px_rgba(254,165,121,0.8)]" : ""
        }`}
      />
    </div>
  );
}
