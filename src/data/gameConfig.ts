import type { ChaserEnemy, GameCookieItem, MazeMap, Obstacle } from "@/types/game";

/** Board dimensions with exact 32px square grid cells (19 cols x 13 rows) */
export const BOARD_WIDTH = 608;
export const BOARD_HEIGHT = 416;

/** Player and cookie dimensions in logical units */
export const PLAYER_SIZE = 22;
export const COOKIE_SIZE = 18;

/** Movement speed per frame */
export const PLAYER_SPEED = 3.5;

/** Points configuration per cookie type */
export const POINTS: Record<GameCookieItem["type"], number> = {
  tradicional: 10,
  recheado: 20,
};

/** Magisserie brand official sprites */
export const SPRITES = {
  playerClosed: "/assets/game/magisserie-fechada.png",
  playerOpen: "/assets/game/magisserie-aberta.png",
  tradicional: "/assets/game/cookie-tradicional.png",
  recheado: "/assets/game/cookie-recheado.png",
} as const;

export const MENU_URL = "https://magisserie.com.br";

/**
 * Grid parser helper for designing custom original Magisserie mazes.
 * Legend:
 * '#' = Wall obstacle
 * '.' = Cookie tradicional (10 pts)
 * 'R' = Cookie recheado (20 pts)
 * 'P' = Player start location
 * 'C' = Chantilly Chaser spawn
 * 'D' = Donut Chaser spawn
 * 'M' = Rolo de Massa Chaser spawn
 * ' ' = Open corridor
 */
function parseGridMap(
  id: string,
  name: string,
  description: string,
  grid: string[],
): MazeMap & { initialChasers: ChaserEnemy[] } {
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
      } else if (char === "P") {
        playerStart = { x: centerX, y: centerY };
      } else if (char === "C") {
        initialChasers.push({
          id: chaserId++,
          name: "Chantilly Encantado",
          type: "chantilly",
          x: centerX,
          y: centerY,
          direction: "left",
          speed: 2.2,
          color: "#6ac5be",
        });
      } else if (char === "D") {
        initialChasers.push({
          id: chaserId++,
          name: "Donut Travesso",
          type: "donut",
          x: centerX,
          y: centerY,
          direction: "right",
          speed: 2.4,
          color: "#fea579",
        });
      } else if (char === "M") {
        initialChasers.push({
          id: chaserId++,
          name: "Rolo Encantado",
          type: "rolo",
          x: centerX,
          y: centerY,
          direction: "up",
          speed: 2.0,
          color: "#21687a",
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
  };
}

/** Original Magisserie Map 1: "Bancada Principal da Magisserie" (19x13 grid) */
const GRID_MAP_1 = [
  "###################",
  "#R. .#...C...#...R#",
  "#.#.#.#.###.#.#.#.#",
  "#...#... . ...#...#",
  "###.###.###.###.###",
  "#...#...#P#...#...#",
  "#.#####.#.#.#####.#",
  "#...R... . ...R...#",
  "###.###.###.###.###",
  "#...#...#...#...#.#",
  "#.#.#.#.###.#.#.#.#",
  "#R.D.#...M...#...R#",
  "###################",
];

/** Original Magisserie Map 2: "Cozinha Encantada" (19x13 grid) */
const GRID_MAP_2 = [
  "###################",
  "#R...#...C...#...R#",
  "#.#####.###.#####.#",
  "#...#... . ...#...#",
  "###.#.#######.#.###",
  "#...R..D#P#M..R...#",
  "#.#####.#.#.#####.#",
  "#...#... . ...#...#",
  "###.#.#######.#.###",
  "#...#...R...#...#.#",
  "#.#####.###.#####.#",
  "#R...#...R...#...R#",
  "###################",
];

export const MAZE_MAPS = [
  parseGridMap(
    "bancada-magisserie",
    "Bancada da Magisserie",
    "Labirinto artesanal clássico com confeitos encantados perseguidores!",
    GRID_MAP_1,
  ),
  parseGridMap(
    "cozinha-encantada",
    "Cozinha Encantada",
    "Fase 2: Desafio mais rápido com utensílios mágicos de confeitaria!",
    GRID_MAP_2,
  ),
];

export function getMazeMap(mapId?: string) {
  return MAZE_MAPS.find((m) => m.id === mapId) || MAZE_MAPS[0];
}
