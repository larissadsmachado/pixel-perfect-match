import { BOARD_HEIGHT, BOARD_WIDTH, PLAYER_SIZE } from "@/data/gameConfig";
import type { ChaserEnemy } from "@/types/game";

export function GameChaser({ chaser }: { chaser: ChaserEnemy }) {
  const sizePercent = (PLAYER_SIZE / BOARD_WIDTH) * 100;
  const isScared = chaser.isScared;

  return (
    <div
      className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none z-10 transition-transform duration-100 ${
        isScared ? "animate-bounce scale-110" : "animate-pulse"
      }`}
      style={{
        left: `${(chaser.x / BOARD_WIDTH) * 100}%`,
        top: `${(chaser.y / BOARD_HEIGHT) * 100}%`,
        width: `${sizePercent}%`,
        height: `${(PLAYER_SIZE / BOARD_HEIGHT) * 100}%`,
      }}
    >
      {isScared ? (
        /* Scared Confeito Mode */
        <div className="relative flex size-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-700 p-1 shadow-lg ring-2 ring-white/80 animate-pulse">
          <span className="text-xs">💧</span>
          <div className="absolute top-1 flex gap-1">
            <span className="size-1 rounded-full bg-white animate-ping" />
            <span className="size-1 rounded-full bg-white animate-ping" />
          </div>
        </div>
      ) : (
        /* Normal Confeito Modes */
        <>
          {chaser.type === "chantilly" && (
            <div className="relative flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#6ac5be] to-[#21687a] p-1 shadow-lg ring-2 ring-white/60">
              <span className="text-xs">🧁</span>
              <div className="absolute top-1 flex gap-1">
                <span className="size-1 rounded-full bg-white" />
                <span className="size-1 rounded-full bg-white" />
              </div>
            </div>
          )}

          {chaser.type === "donut" && (
            <div className="relative flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#fea579] to-[#e07a5f] p-1 shadow-lg ring-2 ring-white/60">
              <span className="text-xs">🍩</span>
              <div className="absolute top-1 flex gap-1">
                <span className="size-1 rounded-full bg-white" />
                <span className="size-1 rounded-full bg-white" />
              </div>
            </div>
          )}

          {chaser.type === "rolo" && (
            <div className="relative flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#21687a] to-[#14424e] p-1 shadow-lg ring-2 ring-white/60">
              <span className="text-xs">👩‍🍳</span>
            </div>
          )}

          {chaser.type === "morango" && (
            <div className="relative flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#e56b6f] to-[#b83b5e] p-1 shadow-lg ring-2 ring-amber-300/80">
              <span className="text-xs">🍓</span>
              <div className="absolute top-1 flex gap-1">
                <span className="size-1 rounded-full bg-white" />
                <span className="size-1 rounded-full bg-white" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
