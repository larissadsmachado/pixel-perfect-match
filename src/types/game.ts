export type CookieType = "tradicional" | "recheado";

export type Direction = "up" | "down" | "left" | "right";

export interface GameCookieItem {
  id: number;
  type: CookieType;
  /** logical board units */
  x: number;
  y: number;
  points: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}
