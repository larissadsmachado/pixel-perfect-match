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
  let transform = "scale(1)";

  if (direction === "left") {
    transform = "scaleX(-1)";
  } else if (direction === "right") {
    transform = "scaleX(1)";
  } else if (direction === "up") {
    transform = "rotate(-25deg)";
  } else if (direction === "down") {
    transform = "rotate(25deg)";
  }

  if (eating) {
    transform += " scale(1.25)";
  } else if (moving) {
    transform += " scale(1.08)";
  }

  return (
    <img
      src={eating ? SPRITES.playerOpen : SPRITES.playerClosed}
      alt={eating ? "Mascote Magisserie comendo cookie" : "Mascote Magisserie"}
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none drop-shadow-md transition-transform duration-75"
      style={{
        left: `${(x / BOARD_WIDTH) * 100}%`,
        top: `${(y / BOARD_HEIGHT) * 100}%`,
        width: `${(PLAYER_SIZE / BOARD_WIDTH) * 100}%`,
        transform,
      }}
    />
  );
}
