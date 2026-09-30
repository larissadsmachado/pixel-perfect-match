export type CookieType = "tradicional" | "recheado" | "super";

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
  type?: "wall" | "counter" | "decor";
}

export interface MapTheme {
  boardBg: string;
  boardPattern: string;
  wallGradient: string;
  wallBorder: string;
  wallShadow: string;
  badgeBg: string;
  badgeText: string;
  difficultyLabel: string;
}

export interface MazeMap {
  id: string;
  name: string;
  description: string;
  gridWidth: number;
  gridHeight: number;
  playerStart: { x: number; y: number };
  obstacles: Obstacle[];
  cookies: GameCookieItem[];
  theme: MapTheme;
}

export interface GameMatch {
  id?: string;
  user_id?: string | null;
  player_name: string;
  score: number;
  cookies_collected: number;
  total_cookies: number;
  reference_month: string; // "YYYY-MM"
  created_at?: string;
}

export interface RankingEntry {
  position: number;
  id: string;
  player_name: string;
  score: number;
  cookies_collected: number;
  reference_month: string;
  created_at: string;
}

export interface DiscountCoupon {
  id: string;
  user_id?: string;
  code: string;
  discount_percent: number;
  reason: string;
  ranking_position?: number | null;
  reference_month: string;
  status: "available" | "used";
  rules: string;
  created_at: string;
}

export interface ChaserEnemy {
  id: number;
  name: string;
  type: "chantilly" | "donut" | "rolo" | "morango";
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  direction: Direction;
  speed: number;
  color: string;
  isScared?: boolean;
}
