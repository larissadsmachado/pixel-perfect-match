import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, RotateCcw, Award, Star, ShoppingBag, Trophy, Flame } from "lucide-react";
import { MENU_URL } from "@/data/gameConfig";

export type SweetType = "tradicional" | "recheado" | "morango" | "cupcake" | "donut" | "super";

interface SweetConfig {
  type: SweetType;
  name: string;
  icon: string;
  points: number;
  bg: string;
  border: string;
}

const SWEETS: Record<SweetType, SweetConfig> = {
  tradicional: {
    type: "tradicional",
    name: "Cookie Tradicional",
    icon: "🍪",
    points: 10,
    bg: "bg-amber-100/90",
    border: "border-amber-300",
  },
  recheado: {
    type: "recheado",
    name: "Cookie Recheado",
    icon: "🍫",
    points: 15,
    bg: "bg-amber-900/90 text-amber-100",
    border: "border-amber-700",
  },
  morango: {
    type: "morango",
    name: "Morango Mágico",
    icon: "🍓",
    points: 20,
    bg: "bg-rose-100/90",
    border: "border-rose-300",
  },
  cupcake: {
    type: "cupcake",
    name: "Cupcake Chantilly",
    icon: "🧁",
    points: 20,
    bg: "bg-teal-100/90",
    border: "border-teal-300",
  },
  donut: {
    type: "donut",
    name: "Donut Glaceado",
    icon: "🍩",
    points: 25,
    bg: "bg-orange-100/90",
    border: "border-orange-300",
  },
  super: {
    type: "super",
    name: "Super Cookie Dourado",
    icon: "⭐",
    points: 50,
    bg: "bg-yellow-300 text-amber-950 font-bold shadow-md animate-pulse",
    border: "border-yellow-500",
  },
};

const BASE_TYPES: SweetType[] = ["tradicional", "recheado", "morango", "cupcake", "donut"];

const GRID_SIZE = 7;
const INITIAL_MOVES = 20;

const TARGET_STARS = {
  star1: 800,
  star2: 1800,
  star3: 3200,
};

interface Tile {
  id: string;
  type: SweetType;
  row: number;
  col: number;
  isMatched?: boolean;
  isSuperExploding?: boolean;
}

function getRandomType(): SweetType {
  return BASE_TYPES[Math.floor(Math.random() * BASE_TYPES.length)];
}

/** Generate initial grid without any pre-existing 3-matches */
function createInitialGrid(): Tile[][] {
  const grid: Tile[][] = [];
  let idCounter = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let type: SweetType;
      do {
        type = getRandomType();
      } while (
        (c >= 2 && row[c - 1].type === type && row[c - 2].type === type) ||
        (r >= 2 && grid[r - 1][c].type === type && grid[r - 2][c].type === type)
      );

      row.push({
        id: `tile-${r}-${c}-${idCounter++}`,
        type,
        row: r,
        col: c,
      });
    }
    grid.push(row);
  }

  return grid;
}

/** Check grid for horizontal & vertical 3-matches */
function findMatches(grid: Tile[][]): {
  matchedCoords: Set<string>;
  superCreates: Array<{ row: number; col: number }>;
} {
  const matchedCoords = new Set<string>();
  const superCreates: Array<{ row: number; col: number }> = [];

  // Horizontal matches
  for (let r = 0; r < GRID_SIZE; r++) {
    let matchLen = 1;
    for (let c = 0; c < GRID_SIZE; c++) {
      const isLast = c === GRID_SIZE - 1;
      const isMatch = !isLast && grid[r][c].type === grid[r][c + 1].type;

      if (isMatch) {
        matchLen++;
      } else {
        if (matchLen >= 3) {
          for (let k = c - matchLen + 1; k <= c; k++) {
            matchedCoords.add(`${r},${k}`);
          }
          if (matchLen >= 4) {
            superCreates.push({ row: r, col: c - Math.floor(matchLen / 2) });
          }
        }
        matchLen = 1;
      }
    }
  }

  // Vertical matches
  for (let c = 0; c < GRID_SIZE; c++) {
    let matchLen = 1;
    for (let r = 0; r < GRID_SIZE; r++) {
      const isLast = r === GRID_SIZE - 1;
      const isMatch = !isLast && grid[r][c].type === grid[r + 1][c].type;

      if (isMatch) {
        matchLen++;
      } else {
        if (matchLen >= 3) {
          for (let k = r - matchLen + 1; k <= r; k++) {
            matchedCoords.add(`${k},${c}`);
          }
          if (matchLen >= 4) {
            superCreates.push({ row: r - Math.floor(matchLen / 2), col: c });
          }
        }
        matchLen = 1;
      }
    }
  }

  return { matchedCoords, superCreates };
}

export function CookieMatchGame() {
  const [grid, setGrid] = useState<Tile[][]>(() => createInitialGrid());
  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null);
  const [movesLeft, setMovesLeft] = useState(INITIAL_MOVES);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const nextId = useRef(1000);

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1200);
  };

  const restartGame = useCallback(() => {
    setGrid(createInitialGrid());
    setSelectedTile(null);
    setMovesLeft(INITIAL_MOVES);
    setScore(0);
    setCombo(0);
    setIsAnimating(false);
    setGameOver(false);
    setCopiedCoupon(null);
    setFeedback(null);
  }, []);

  // Process cascading matches & gravity refill
  const processCascades = useCallback(async (currentGrid: Tile[][], currentCombo: number) => {
    const { matchedCoords, superCreates } = findMatches(currentGrid);

    if (matchedCoords.size === 0) {
      setIsAnimating(false);
      setCombo(0);
      return;
    }

    setIsAnimating(true);
    const newCombo = currentCombo + 1;
    setCombo(newCombo);

    // Calculate score for this match wave
    let pointsGained = 0;
    matchedCoords.forEach((coord) => {
      const [r, c] = coord.split(",").map(Number);
      const sweet = SWEETS[currentGrid[r][c].type];
      pointsGained += (sweet ? sweet.points : 10) * newCombo;
    });

    setScore((s) => s + pointsGained);

    if (newCombo > 1) {
      triggerFeedback(`COMBO x${newCombo}! +${pointsGained} pts`);
    }

    // Mark matched tiles
    const gridWithMatches = currentGrid.map((row) =>
      row.map((tile) => {
        const key = `${tile.row},${tile.col}`;
        if (matchedCoords.has(key)) {
          return { ...tile, isMatched: true };
        }
        return tile;
      })
    );

    setGrid(gridWithMatches);

    // Wait for pop animation
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Drop tiles down & generate top tiles
    const newGrid: Tile[][] = Array.from({ length: GRID_SIZE }, () => []);

    for (let c = 0; c < GRID_SIZE; c++) {
      const columnTiles: Tile[] = [];
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        const tile = gridWithMatches[r][c];
        if (!tile.isMatched) {
          columnTiles.push(tile);
        }
      }

      // Check if super cookie needs to be spawned in this column
      const superInCol = superCreates.filter((s) => s.col === c);
      superInCol.forEach(() => {
        columnTiles.push({
          id: `super-${nextId.current++}`,
          type: "super",
          row: 0,
          col: c,
        });
      });

      // Fill remaining gaps with new random sweets
      while (columnTiles.length < GRID_SIZE) {
        columnTiles.push({
          id: `tile-new-${nextId.current++}`,
          type: getRandomType(),
          row: 0,
          col: c,
        });
      }

      // Reconstruct column top-to-bottom
      columnTiles.reverse();
      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[r] = newGrid[r] || [];
        newGrid[r][c] = {
          ...columnTiles[r],
          row: r,
          col: c,
          isMatched: false,
        };
      }
    }

    setGrid(newGrid);

    // Wait for drop animation, then check next cascade
    await new Promise((resolve) => setTimeout(resolve, 250));
    await processCascades(newGrid, newCombo);
  }, []);

  // Handle Tile Click / Swap
  const handleTileClick = async (row: number, col: number) => {
    if (isAnimating || gameOver || movesLeft <= 0) return;

    if (!selectedTile) {
      setSelectedTile({ row, col });
      return;
    }

    const { row: r1, col: c1 } = selectedTile;
    const isAdjacent = Math.abs(r1 - row) + Math.abs(c1 - col) === 1;

    if (!isAdjacent) {
      setSelectedTile({ row, col });
      return;
    }

    // Attempt Swap
    setIsAnimating(true);
    setSelectedTile(null);

    const draftGrid = grid.map((r) => r.map((tile) => ({ ...tile })));
    const tile1 = draftGrid[r1][c1];
    const tile2 = draftGrid[row][col];

    draftGrid[r1][c1] = { ...tile2, row: r1, col: c1 };
    draftGrid[row][col] = { ...tile1, row, col };

    setGrid(draftGrid);

    // Check if swap creates matches
    const { matchedCoords } = findMatches(draftGrid);

    if (matchedCoords.size > 0) {
      // Valid move!
      const remainingMoves = movesLeft - 1;
      setMovesLeft(remainingMoves);

      await processCascades(draftGrid, 0);

      if (remainingMoves <= 0) {
        setGameOver(true);
      }
    } else {
      // Invalid swap - animate swap back
      triggerFeedback("Nenhuma combinação!");
      await new Promise((resolve) => setTimeout(resolve, 280));

      // Revert swap
      const revertedGrid = draftGrid.map((r) => r.map((tile) => ({ ...tile })));
      revertedGrid[r1][c1] = { ...tile1, row: r1, col: c1 };
      revertedGrid[row][col] = { ...tile2, row, col };

      setGrid(revertedGrid);
      setIsAnimating(false);
    }
  };

  const currentStars =
    score >= TARGET_STARS.star3 ? 3 : score >= TARGET_STARS.star2 ? 2 : score >= TARGET_STARS.star1 ? 1 : 0;

  const progressPercent = Math.min(100, (score / TARGET_STARS.star3) * 100);

  const generateCouponCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "MAGI5-";
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const couponCode = useRef(generateCouponCode());

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(couponCode.current);
    setCopiedCoupon(couponCode.current);
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Game HUD Header */}
      <div className="flex w-full flex-col gap-2 rounded-3xl border border-border bg-card p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍬</span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-foreground leading-tight">
                Combinações Magisserie
              </h3>
              <p className="text-xs text-muted-foreground">Junte 3 ou mais doces iguais!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-muted-foreground">Movimentos</span>
              <span className="font-black text-lg text-primary">{movesLeft}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-muted-foreground">Pontuação</span>
              <span className="font-black text-lg text-foreground">{score}</span>
            </div>
          </div>
        </div>

        {/* Stars Goal Progress */}
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Objetivo de Estrelas</span>
            <div className="flex items-center gap-1">
              <Star className={`size-4 ${currentStars >= 1 ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
              <Star className={`size-4 ${currentStars >= 2 ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
              <Star className={`size-4 ${currentStars >= 3 ? "fill-amber-400 text-amber-400 text-amber-400" : "text-muted"}`} />
            </div>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-secondary p-0.5 border border-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6ac5be] via-[#fea579] to-amber-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Floating feedback toast */}
      {feedback && (
        <div className="rounded-full bg-primary px-4 py-1.5 text-xs font-black text-primary-foreground shadow-lg animate-bounce">
          {feedback}
        </div>
      )}

      {/* Match-3 Game Board Grid */}
      <div
        className="relative grid gap-1.5 p-3 rounded-3xl border-2 border-border bg-[#fef7ef] shadow-xl select-none touch-none"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          width: "100%",
          maxWidth: "420px",
          aspectRatio: "1/1",
        }}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const isSelected = selectedTile?.row === r && selectedTile?.col === c;
            const sweet = SWEETS[tile.type] || SWEETS.tradicional;

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleTileClick(r, c)}
                disabled={isAnimating || gameOver}
                className={`relative flex items-center justify-center rounded-2xl border-2 transition-all duration-200 cursor-pointer aspect-square ${
                  sweet.bg
                } ${sweet.border} ${
                  isSelected
                    ? "ring-4 ring-amber-400 scale-105 z-10 shadow-lg"
                    : "hover:scale-98 active:scale-95 shadow-sm"
                } ${tile.isMatched ? "scale-0 opacity-0 transition-transform duration-300" : "scale-100 opacity-100"}`}
              >
                <span className="text-2xl sm:text-3xl filter drop-shadow-sm pointer-events-none">
                  {sweet.icon}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between w-full max-w-[420px] gap-2">
        <button
          type="button"
          onClick={restartGame}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-black text-foreground shadow-sm hover:bg-secondary transition-colors"
        >
          <RotateCcw className="size-4 text-primary" />
          <span>Reiniciar Jogo</span>
        </button>

        <a
          href={MENU_URL}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        >
          <ShoppingBag className="size-4" />
          <span>Ver Cookies</span>
        </a>
      </div>

      {/* End Game Result Dialog */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border-2 border-border bg-card p-6 shadow-2xl text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
              {currentStars >= 1 ? "🎉" : "🍪"}
            </div>

            <div>
              <h2 className="font-black text-xl text-foreground">
                {currentStars >= 1 ? "Parabéns! Fim de Jogo!" : "Que quase! Tente Novamente!"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Sua pontuação final: <strong className="text-foreground">{score} pontos</strong>
              </p>
            </div>

            {/* Stars Won */}
            <div className="flex items-center justify-center gap-2">
              <Star className={`size-8 ${currentStars >= 1 ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
              <Star className={`size-8 ${currentStars >= 2 ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
              <Star className={`size-8 ${currentStars >= 3 ? "fill-amber-400 text-amber-400 text-amber-400" : "text-muted"}`} />
            </div>

            {/* Coupon reward if 1+ star */}
            {currentStars >= 1 && (
              <div className="flex w-full flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left">
                <div className="flex items-center gap-2 text-xs font-black text-primary">
                  <Award className="size-4" />
                  <span>CUPOM DE DESCONTO CONQUISTADO!</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Você ganhou 5% OFF em qualquer pedido na Magisserie!
                </p>

                <div className="flex items-center justify-between gap-2 rounded-xl bg-card border border-border p-2 mt-1">
                  <code className="font-mono font-black text-sm text-foreground tracking-wider">
                    {couponCode.current}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCoupon}
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-black text-primary-foreground hover:opacity-90"
                  >
                    {copiedCoupon ? "Copiado! ✓" : "Copiar"}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={restartGame}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
            >
              Jogar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

