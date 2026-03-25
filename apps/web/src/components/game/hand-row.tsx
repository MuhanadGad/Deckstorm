import type { PointerEvent, RefObject } from "react";

import { cn } from "@/lib/utils";

import CardSlot from "./card-slot";
import GameCardFace, { type GameCardData } from "./game-card-face";

type HandRowProps = {
  cards?: GameCardData[];
  cardCount: number;
  dockHoverEnabled?: boolean;
  draggedCardId?: string | null;
  onCardPointerDown?: (
    card: GameCardData,
    index: number,
    event: PointerEvent<HTMLDivElement>,
  ) => void;
  slotCount?: number;
  mirrored?: boolean;
  size?: "opponent" | "player";
  slotRefs?: RefObject<(HTMLDivElement | null)[]>;
};

const sizeClasses = {
  opponent:
    "-mx-[1.05rem] h-24 w-[4.3rem] rounded-[1rem] sm:-mx-[1.2rem] sm:h-28 sm:w-[4.9rem] lg:-mx-[1.3rem] lg:h-31 lg:w-[5.5rem]",
  player:
    "-mx-[1.7rem] h-52 w-[8.1rem] rounded-[1.1rem] sm:-mx-[2rem] sm:h-58 sm:w-[9rem] lg:-mx-[2.2rem] lg:h-65 lg:w-[10rem]",
} as const;

export default function HandRow({
  cards,
  cardCount,
  dockHoverEnabled = true,
  draggedCardId,
  slotCount = cardCount,
  mirrored = false,
  onCardPointerDown,
  size = "opponent",
  slotRefs,
}: HandRowProps) {
  return (
    <div
      className={cn(
        "hand-row flex items-center justify-center gap-3 overflow-visible sm:gap-4",
        size === "player" && dockHoverEnabled && "hand-row-dock",
        mirrored && "scale-y-[-1]",
      )}
    >
      {Array.from({ length: slotCount }).map((_, index) => {
        const card = size === "player" ? (cards?.[index] ?? null) : null;

        return (
          <CardSlot
            key={index}
            hidden={size === "opponent"}
            revealed={size === "player" ? Boolean(card) : index < cardCount}
            slotRef={(node) => {
              if (slotRefs) {
                slotRefs.current[index] = node;
              }
            }}
            transitionDelayMs={index * 35}
            onPointerDown={
              size === "player" && card && onCardPointerDown
                ? (event) => {
                    onCardPointerDown(card, index, event);
                  }
                : undefined
            }
            className={cn(
              sizeClasses[size],
              size === "player" &&
                "hand-card card-slot-faceup cursor-grab touch-none select-none active:cursor-grabbing",
              draggedCardId === card?.id &&
                "pointer-events-none opacity-0 saturate-75",
            )}
          >
            {size === "player" && card ? <GameCardFace card={card} /> : null}
          </CardSlot>
        );
      })}
    </div>
  );
}
