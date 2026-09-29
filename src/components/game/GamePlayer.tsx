import { BOARD_HEIGHT, BOARD_WIDTH, PLAYER_SIZE, SPRITES } from "@/data/gameConfig";
import type { Direction } from "@/types/game";

interface Props {
  x: number;
  y: number;
  direction: Direction;
  eating: boolean;
  moving: boolean;
}

export function GamePlayer({ x, y, direction, eating, moving }: Props) {
  const tilt = direction === "left" ? -8 : direction === "right" ? 8 : 0;

  return (
    <img
      src={eating ? SPRITES.playerOpen : SPRITES.playerClosed}
      alt={eating ? "Personagem Magisserie de boca aberta" : "Personagem Magisserie"}
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-md transition-transform duration-100"
      style={{
        left: `${(x / BOARD_WIDTH) * 100}%`,
        top: `${(y / BOARD_HEIGHT) * 100}%`,
        width: `${(PLAYER_SIZE / BOARD_WIDTH) * 100}%`,
        rotate: `${tilt}deg`,
        scale: eating ? "1.12" : moving ? "1.04" : "1",
      }}
    />
  );
}
