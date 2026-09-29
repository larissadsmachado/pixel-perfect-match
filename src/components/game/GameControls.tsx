import type { ReactNode } from "react";
import type { Direction } from "@/types/game";

interface Props {
  onPress: (dir: Direction) => void;
  onRelease: (dir: Direction) => void;
  active: Direction[];
}

const LABELS: Record<Direction, string> = {
  up: "Mover para cima",
  down: "Mover para baixo",
  left: "Mover para a esquerda",
  right: "Mover para a direita",
};

function Pad({
  dir,
  children,
  onPress,
  onRelease,
  active,
}: Props & { dir: Direction; children: ReactNode }) {
  const isActive = active.includes(dir);
  return (
    <button
      type="button"
      aria-label={LABELS[dir]}
      aria-pressed={isActive}
      className={`flex size-16 touch-none select-none items-center justify-center rounded-2xl border border-border bg-card text-2xl font-bold text-foreground shadow-sm transition-transform active:scale-95 sm:size-14 ${
        isActive ? "scale-95 bg-secondary" : ""
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onPress(dir);
      }}
      onPointerUp={() => onRelease(dir)}
      onPointerCancel={() => onRelease(dir)}
      onPointerLeave={() => onRelease(dir)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export function GameControls(props: Props) {
  return (
    <div className="flex flex-col items-center gap-2" aria-label="Controles de movimento" role="group">
      <Pad {...props} dir="up">
        ↑
      </Pad>
      <div className="flex gap-2">
        <Pad {...props} dir="left">
          ←
        </Pad>
        <Pad {...props} dir="down">
          ↓
        </Pad>
        <Pad {...props} dir="right">
          →
        </Pad>
      </div>
    </div>
  );
}
