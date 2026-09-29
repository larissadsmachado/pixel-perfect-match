import type { GameCookieItem, Obstacle } from "@/types/game";

/** Logical board size. All positions are expressed in these units. */
export const BOARD_WIDTH = 600;
export const BOARD_HEIGHT = 420;

/** Player size in board units. */
export const PLAYER_SIZE = 46;
/** Cookie size in board units. */
export const COOKIE_SIZE = 34;

/** Movement speed in board units per frame (at 60fps). */
export const PLAYER_SPEED = 4;

export const POINTS: Record<GameCookieItem["type"], number> = {
  tradicional: 10,
  recheado: 20,
};

/** Swap easily for the official art later — paths stay the same. */
export const SPRITES = {
  playerClosed: "/assets/game/magisserie-fechada.png",
  playerOpen: "/assets/game/magisserie-aberta.png",
  tradicional: "/assets/game/cookie-tradicional.png",
  recheado: "/assets/game/cookie-recheado.png",
} as const;

/** Configurable link for the "Conhecer os cookies" button. */
export const MENU_URL = "#";

/** Architecture ready for obstacles — none for now. */
export const OBSTACLES: Obstacle[] = [];

const LAYOUT: Array<{ type: GameCookieItem["type"]; x: number; y: number }> = [
  { type: "tradicional", x: 90, y: 80 },
  { type: "tradicional", x: 210, y: 60 },
  { type: "recheado", x: 330, y: 95 },
  { type: "tradicional", x: 470, y: 70 },
  { type: "tradicional", x: 120, y: 210 },
  { type: "recheado", x: 300, y: 215 },
  { type: "tradicional", x: 500, y: 200 },
  { type: "tradicional", x: 80, y: 340 },
  { type: "recheado", x: 240, y: 350 },
  { type: "tradicional", x: 400, y: 330 },
  { type: "tradicional", x: 520, y: 355 },
  { type: "recheado", x: 400, y: 160 },
];

export function createCookies(): GameCookieItem[] {
  return LAYOUT.map((c, i) => ({
    id: i + 1,
    type: c.type,
    x: c.x,
    y: c.y,
    points: POINTS[c.type],
  }));
}

export const START_POSITION = { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 };
