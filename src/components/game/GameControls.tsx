import type { ReactNode } from "react";
import type { Direction } from "@/types/game";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

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

  const startPress = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onPress(dir);
  };

  const stopPress = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onRelease(dir);
  };

  return (
    <button
      type="button"
      aria-label={LABELS[dir]}
      aria-pressed={isActive}
      className={`flex size-14 sm:size-16 touch-none select-none items-center justify-center rounded-2xl border-2 transition-all active:scale-95 shadow-md ${
        isActive
          ? "border-primary bg-primary text-primary-foreground scale-95 shadow-inner"
          : "border-border bg-card text-foreground hover:bg-secondary/20 hover:border-secondary"
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
        onPress(dir);
      }}
      onPointerUp={stopPress}
      onPointerCancel={stopPress}
      onPointerLeave={stopPress}
      onTouchStart={startPress}
      onTouchEnd={stopPress}
      onTouchCancel={stopPress}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export function GameControls(props: Props) {
  return (
    <div
      className="flex flex-col items-center gap-2 touch-none select-none my-1"
      aria-label="Controles de movimento do mascote"
      role="group"
    >
      <Pad {...props} dir="up">
        <ArrowUp className="size-7 stroke-[3]" />
      </Pad>
      <div className="flex gap-2">
        <Pad {...props} dir="left">
          <ArrowLeft className="size-7 stroke-[3]" />
        </Pad>
        <Pad {...props} dir="down">
          <ArrowDown className="size-7 stroke-[3]" />
        </Pad>
        <Pad {...props} dir="right">
          <ArrowRight className="size-7 stroke-[3]" />
        </Pad>
      </div>
    </div>
  );
}
