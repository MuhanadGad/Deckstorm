import type { RefObject } from "react";

import { cn } from "@/lib/utils";

import CardSlot from "./card-slot";

const sampleHandCards = [
  {
    attack: 4,
    body: "On play: Draw 1 card. If this is your second action, gain 1 energy.",
    cost: 2,
    defense: 3,
    title: "Scout",
    type: "Vanguard",
  },
  {
    attack: 3,
    body: "Guard. Nearby allies in the FIELD gain +1 defense until your next turn.",
    cost: 3,
    defense: 5,
    title: "Herald",
    type: "Sentinel",
  },
  {
    attack: 5,
    body: "Quick strike. Deal 2 bonus damage if the target already took damage this round.",
    cost: 4,
    defense: 2,
    title: "Duelist",
    type: "Skirmisher",
  },
  {
    attack: 2,
    body: "Create a Spark in your HAND. Sparks cost 1 less and cycle when played.",
    cost: 1,
    defense: 4,
    title: "Scribe",
    type: "Invoker",
  },
  {
    attack: 6,
    body: "Heavy. At end of turn, fortify the leftmost ally on the FIELD for 2.",
    cost: 5,
    defense: 6,
    title: "Colossus",
    type: "Titan",
  },
  {
    attack: 1,
    body: "When discarded, return this to your HAND with +2 attack next turn.",
    cost: 2,
    defense: 1,
    title: "Wisp",
    type: "Spirit",
  },
] as const;

type HandRowProps = {
  cardCount: number;
  slotCount?: number;
  mirrored?: boolean;
  size?: "opponent" | "player";
  slotRefs?: RefObject<(HTMLDivElement | null)[]>;
};

const sizeClasses = {
  opponent:
    "-mx-[1.05rem] h-24 w-[4.3rem] rounded-2xl sm:-mx-[1.2rem] sm:h-28 sm:w-[4.9rem] lg:-mx-[1.3rem] lg:h-31 lg:w-[5.5rem]",
  player:
    "-mx-[1.7rem] h-52 w-[8.1rem] rounded-[1.9rem] sm:-mx-[2rem] sm:h-58 sm:w-[9rem] lg:-mx-[2.2rem] lg:h-65 lg:w-[10rem]",
} as const;

export default function HandRow({
  cardCount,
  slotCount = cardCount,
  mirrored = false,
  size = "opponent",
  slotRefs,
}: HandRowProps) {
  return (
    <div
      className={cn(
        "hand-row flex items-center justify-center gap-3 overflow-visible sm:gap-4",
        size === "player" && "hand-row-dock",
        mirrored && "scale-y-[-1]",
      )}
    >
      {Array.from({ length: slotCount }).map((_, index) => (
        <CardSlot
          key={index}
          hidden={size === "opponent"}
          revealed={index < cardCount}
          slotRef={(node) => {
            if (slotRefs) {
              slotRefs.current[index] = node;
            }
          }}
          transitionDelayMs={index * 35}
          className={cn(
            sizeClasses[size],
            size === "player" &&
              "hand-card card-slot-faceup cursor-pointer select-none",
          )}
        >
          {size === "player" && index < cardCount ? (
            <div className="pointer-events-none flex h-full flex-col justify-between p-3 sm:p-3.5 lg:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-stone-700/80 sm:text-[0.62rem] lg:text-[0.68rem]">
                    {sampleHandCards[index % sampleHandCards.length].type}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-stone-950 sm:text-[1rem] lg:text-[1.06rem]">
                    {sampleHandCards[index % sampleHandCards.length].title}
                  </div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-950/12 bg-stone-950/6 text-sm font-bold text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:h-9 sm:w-9 sm:text-base">
                  {sampleHandCards[index % sampleHandCards.length].cost}
                </div>
              </div>

              <p className="text-[0.7rem] leading-[1.45] text-stone-800/92 sm:text-[0.78rem] lg:text-[0.84rem]">
                {sampleHandCards[index % sampleHandCards.length].body}
              </p>

              <div className="flex items-center justify-between gap-2 border-t border-stone-950/10 pt-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone-700/88 sm:text-[0.68rem]">
                <span>
                  ATK {sampleHandCards[index % sampleHandCards.length].attack}
                </span>
                <span>
                  DEF {sampleHandCards[index % sampleHandCards.length].defense}
                </span>
              </div>
            </div>
          ) : null}
        </CardSlot>
      ))}
    </div>
  );
}
