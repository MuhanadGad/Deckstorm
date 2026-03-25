import { cn } from "@/lib/utils";

type DeckStackProps = {
  count: number;
  label: string;
  className?: string;
  cardRef?: (node: HTMLDivElement | null) => void;
};

export default function DeckStack({
  count,
  label,
  className,
  cardRef,
}: DeckStackProps) {
  return (
    <div
      className={cn(
        "flex w-[5.4rem] shrink-0 flex-col items-center gap-2 text-center sm:w-[6rem]",
        className,
      )}
    >
      <div className="relative h-30 w-20 sm:h-34 sm:w-[5.4rem] lg:h-38 lg:w-[5.9rem]">
        <div className="card-slot card-slot-hidden absolute inset-x-2 top-2 rounded-[1rem] opacity-50" />
        <div className="card-slot card-slot-hidden absolute inset-x-1 top-1 rounded-[1rem] opacity-70" />
        <div
          ref={cardRef}
          className="card-slot card-slot-hidden absolute inset-0 rounded-[1rem]"
        />
      </div>

      <div className="grid gap-0.5">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-amber-100/72 sm:text-[0.68rem]">
          {label}
        </span>
        <span className="text-sm font-semibold text-white/88 sm:text-base">{count} cards</span>
      </div>
    </div>
  );
}
