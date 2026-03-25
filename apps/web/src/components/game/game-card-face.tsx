import { cn } from "@/lib/utils";

export type GameCardData = {
  attack: number;
  body: string;
  cost: number;
  defense: number;
  id: string;
  title: string;
  type: string;
};

type GameCardFaceProps = {
  card: GameCardData;
  compact?: boolean;
  className?: string;
};

export default function GameCardFace({
  card,
  compact = false,
  className,
}: GameCardFaceProps) {
  return (
    <div
      className={cn(
        "pointer-events-none flex h-full flex-col justify-between",
        compact ? "p-2.5 sm:p-3" : "p-3 sm:p-3.5 lg:p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div
            className={cn(
              "font-semibold uppercase tracking-[0.24em] text-stone-700/80",
              compact
                ? "text-[0.5rem] sm:text-[0.54rem]"
                : "text-[0.58rem] sm:text-[0.62rem] lg:text-[0.68rem]",
            )}
          >
            {card.type}
          </div>
          <div
            className={cn(
              "mt-1 line-clamp-2 font-semibold leading-tight text-stone-950",
              compact
                ? "text-[0.78rem] sm:text-[0.84rem]"
                : "text-sm sm:text-[1rem] lg:text-[1.06rem]",
            )}
          >
            {card.title}
          </div>
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border border-stone-950/12 bg-stone-950/6 font-bold text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
            compact ? "h-7 w-7 text-[0.8rem]" : "h-8 w-8 text-sm sm:h-9 sm:w-9 sm:text-base",
          )}
        >
          {card.cost}
        </div>
      </div>

      <p
        className={cn(
          "text-stone-800/92",
          compact
            ? "line-clamp-4 text-[0.58rem] leading-[1.35] sm:text-[0.62rem]"
            : "text-[0.7rem] leading-[1.45] sm:text-[0.78rem] lg:text-[0.84rem]",
        )}
      >
        {card.body}
      </p>

      <div
        className={cn(
          "flex items-center justify-between gap-2 border-t border-stone-950/10 font-semibold uppercase tracking-[0.18em] text-stone-700/88",
          compact
            ? "pt-1.5 text-[0.52rem] sm:text-[0.56rem]"
            : "pt-2 text-[0.62rem] sm:text-[0.68rem]",
        )}
      >
        <span>ATK {card.attack}</span>
        <span>DEF {card.defense}</span>
      </div>
    </div>
  );
}
