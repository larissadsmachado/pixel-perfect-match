import type { ChaserEnemy, GameCookieItem, MazeMap, MapTheme, Obstacle } from "@/types/game";

/** Board dimensions with exact 32px square grid cells (19 cols x 13 rows) */
export const BOARD_WIDTH = 608;
export const BOARD_HEIGHT = 416;

/** Player and cookie dimensions in logical units */
export const PLAYER_SIZE = 16;
export const COOKIE_SIZE = 14;

/** Movement speed per frame */
export const PLAYER_SPEED = 3.5;

/** Points configuration per cookie type */
export const POINTS: Record<GameCookieItem["type"], number> = {
  tradicional: 10,
  recheado: 20,
  super: 50,
};

/** Magisserie brand official sprites */
export const SPRITES = {
  playerClosed: "/assets/game/magisserie-fechada.png",
  playerOpen: "/assets/game/magisserie-aberta.png",
  tradicional: "/assets/game/cookie-tradicional.png",
  recheado: "/assets/game/cookie-recheado.png",
} as const;

export const MENU_URL = "https://magisserie.vercel.app/";

/** Map Theme 1: Bancada da Magisserie (Soft Teal & Cream Confectionery) */
const THEME_BANCADA: MapTheme = {
  boardBg: "#fef7ef",
  boardPattern: "#6ac5be",
  wallGradient: "from-[#21687a] to-[#184e5b]",
  wallBorder: "border-[#6ac5be]/40",
  wallShadow: "shadow-md shadow-[#21687a]/20",
  badgeBg: "bg-[#6ac5be]/20 text-[#21687a]",
  badgeText: "Confeitaria Artesanal",
  difficultyLabel: "Normal (3 Confeitos)",
};

/** Map Theme 2: Cozinha Encantada (Warm Terracotta & Crimson Gourmet Kitchen) */
const THEME_COZINHA: MapTheme = {
  boardBg: "#fff3eb",
  boardPattern: "#fea579",
  wallGradient: "from-[#c74a30] via-[#d65a3d] to-[#aa3620]",
  wallBorder: "border-[#fea579]/60",
  wallShadow: "shadow-lg shadow-[#c74a30]/30",
  badgeBg: "bg-rose-500/20 text-rose-700 font-bold",
  badgeText: "Cozinha Encantada 🌶️",
  difficultyLabel: "DIFÍCIL (4 Confeitos Rápido)",
};

/**
 * Grid parser helper for designing custom original Magisserie mazes.
 */
function parseGridMap(
  id: string,
  name: string,
  description: string,
  grid: string[],
  theme: MapTheme,
): MazeMap & { initialChasers: ChaserEnemy[]; rawGrid: string[] } {
  const rows = grid.length;
  const cols = grid[0].length;
  const cellW = BOARD_WIDTH / cols;
  const cellH = BOARD_HEIGHT / rows;

  const obstacles: Obstacle[] = [];
  const cookies: GameCookieItem[] = [];
  const initialChasers: ChaserEnemy[] = [];
  let playerStart = { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 };
  let cookieId = 1;
  let chaserId = 1;

  for (let r = 0; r < rows; r++) {
    const rowStr = grid[r];
    for (let c = 0; c < cols; c++) {
      const char = rowStr[c] || " ";
      const x = c * cellW;
      const y = r * cellH;
      const centerX = x + cellW / 2;
      const centerY = y + cellH / 2;

      if (char === "#") {
        obstacles.push({
          x,
          y,
          width: cellW,
          height: cellH,
          type: "wall",
        });
      } else if (char === ".") {
        cookies.push({
          id: cookieId++,
          type: "tradicional",
          x: centerX,
          y: centerY,
          points: POINTS.tradicional,
        });
      } else if (char === "R") {
        cookies.push({
          id: cookieId++,
          type: "recheado",
          x: centerX,
          y: centerY,
          points: POINTS.recheado,
        });
      } else if (char === "W") {
        cookies.push({
          id: cookieId++,
          type: "super",
          x: centerX,
          y: centerY,
          points: POINTS.super,
        });
      } else if (char === "P") {
        playerStart = { x: centerX, y: centerY };
      } else if (char === "C") {
        initialChasers.push({
          id: chaserId++,
          name: "Chantilly Encantado",
          type: "chantilly",
          x: centerX,
          y: centerY,
          spawnX: centerX,
          spawnY: centerY,
          direction: "left",
          speed: 1.6,
          color: "#6ac5be",
        });
      } else if (char === "D") {
        initialChasers.push({
          id: chaserId++,
          name: "Donut Travesso",
          type: "donut",
          x: centerX,
          y: centerY,
          spawnX: centerX,
          spawnY: centerY,
          direction: "right",
          speed: 1.7,
          color: "#fea579",
        });
      } else if (char === "M") {
        initialChasers.push({
          id: chaserId++,
          name: "Rolo Encantado",
          type: "rolo",
          x: centerX,
          y: centerY,
          spawnX: centerX,
          spawnY: centerY,
          direction: "up",
          speed: 1.5,
          color: "#21687a",
        });
      } else if (char === "S") {
        initialChasers.push({
          id: chaserId++,
          name: "Moranguinho Mágico",
          type: "morango",
          x: centerX,
          y: centerY,
          spawnX: centerX,
          spawnY: centerY,
          direction: "down",
          speed: 1.9,
          color: "#e56b6f",
        });
      }
    }
  }

  return {
    id,
    name,
    description,
    gridWidth: cols,
    gridHeight: rows,
    playerStart,
    obstacles,
    cookies,
    initialChasers,
    theme,
    rawGrid: grid,
  };
}

/** Map 1: Bancada Principal da Magisserie (19x13 grid - 100% reachable) */
const GRID_MAP_1 = [
  "###################",
  "#W......C........W#",
  "#.###.#######.###.#",
  "#.#...............#",
  "#.#.###.#####.###.#",
  "#...R.....P.....R.#",
  "#.###.###.#.###.###",
  "#...R...........R.#",
  "#.#.###.#####.###.#",
  "#.#......D.M....#.#",
  "#.###.#######.###.#",
  "#W...............W#",
  "###################",
];

/** Map 2: Cozinha Encantada (19x13 grid - High-Difficulty Gourmet Kitchen - 100% reachable) */
const GRID_MAP_2 = [
  "###################",
  "#W.C........S..R.W#",
  "#.###.#######.###.#",
  "#.#......R......#.#",
  "#.#.###.#####.###.#",
  "#R..D....P.....M.R#",
  "#.###.###.#.###.###",
  "#...R.......R.....#",
  "#.#.###.#####.###.#",
  "#.#......R......#.#",
  "#.###.#######.###.#",
  "#W...............W#",
  "###################",
];

export const MAZE_MAPS = [
  parseGridMap(
    "bancada-magisserie",
    "Bancada da Magisserie",
    "Fase 1: Labirinto clássico artesanal com confeitos encantados.",
    GRID_MAP_1,
    THEME_BANCADA,
  ),
  parseGridMap(
    "cozinha-encantada",
    "Cozinha Encantada",
    "Fase 2 (DIFÍCIL): Novo visual de cozinha gourmet, 4 confeitos rápidos e Super Cookies!",
    GRID_MAP_2,
    THEME_COZINHA,
  ),
];

export function getMazeMap(mapId?: string) {
  return MAZE_MAPS.find((m) => m.id === mapId) || MAZE_MAPS[0];
}
