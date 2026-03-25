import type { RefObject } from "react";

import { cn } from "@/lib/utils";

import CardSlot from "./card-slot";
import GameCardFace, { type GameCardData } from "./game-card-face";

type BoardRowProps = {
  cards?: (GameCardData | null)[];
  dropActive?: boolean;
  highlightedIndex?: number | null;
  slotCount?: number;
  reversed?: boolean;
  size?: "default" | "compact";
  slotRefs?: RefObject<(HTMLDivElement | null)[]>;
};

export default function BoardRow({
  cards,
  dropActive = false,
  highlightedIndex = null,
  slotCount = 5,
  reversed = false,
  size = "default",
  slotRefs,
}: BoardRowProps) {
  const row = Array.from({ length: slotCount }, (_, index) =>
    reversed ? slotCount - 1 - index : index,
  );

  return (
    <div
      className={cn(
        "grid grid-cols-5",
        size === "compact" ? "gap-2.5 sm:gap-3 lg:gap-4" : "gap-3 sm:gap-4 lg:gap-5",
      )}
    >
      {row.map((slotIndex) => {
        const card = cards?.[slotIndex] ?? null;

        return (
          <CardSlot
            key={slotIndex}
            slotRef={(node) => {
              if (slotRefs) {
                slotRefs.current[slotIndex] = node;
              }
            }}
            className={cn(
              "board-slot aspect-[5/7] w-full min-w-0",
              size === "compact" ? "rounded-[1rem]" : "rounded-[1.1rem]",
              card && "card-slot-faceup",
              dropActive && !card && "board-slot-dropzone",
              highlightedIndex === slotIndex && "board-slot-target",
            )}
          >
            {card ? <GameCardFace card={card} compact={size === "compact"} /> : null}
          </CardSlot>
        );
      })}
    </div>
  );
}
