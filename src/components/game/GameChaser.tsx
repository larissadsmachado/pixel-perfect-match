import { BOARD_HEIGHT, BOARD_WIDTH, PLAYER_SIZE } from "@/data/gameConfig";
import type { ChaserEnemy } from "@/types/game";

export function GameChaser({ chaser }: { chaser: ChaserEnemy }) {
  const sizePercent = (PLAYER_SIZE / BOARD_WIDTH) * 100;

  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none z-10 animate-pulse transition-transform duration-100"
      style={{
        left: `${(chaser.x / BOARD_WIDTH) * 100}%`,
        top: `${(chaser.y / BOARD_HEIGHT) * 100}%`,
        width: `${sizePercent}%`,
        height: `${(PLAYER_SIZE / BOARD_HEIGHT) * 100}%`,
      }}
    >
      {chaser.type === "chantilly" && (
        <div className="relative flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#6ac5be] to-[#21687a] p-1 shadow-lg ring-2 ring-white/60">
          <span className="text-xs">🧁</span>
          {/* Eyes */}
          <div className="absolute top-1.5 flex gap-1">
            <span className="size-1 rounded-full bg-white" />
            <span className="size-1 rounded-full bg-white" />
          </div>
        </div>
      )}

      {chaser.type === "donut" && (
        <div className="relative flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#fea579] to-[#e07a5f] p-1 shadow-lg ring-2 ring-white/60">
          <span className="text-xs">🍩</span>
          {/* Eyes */}
          <div className="absolute top-1.5 flex gap-1">
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
    </div>
  );
}

