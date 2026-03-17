import { cn } from "@/lib/utils";

type PlayerProfileProps = {
  name: string;
  title: string;
  initials: string;
  health: number;
  energy: number;
  className?: string;
};

export default function PlayerProfile({
  name,
  title,
  initials,
  health,
  energy,
  className,
}: PlayerProfileProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-[1.45rem] border border-white/12 bg-black/24 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm sm:px-4",
        className,
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-amber-200/22 bg-[radial-gradient(circle_at_top,_rgba(245,214,138,0.26),_rgba(245,214,138,0)_70%),linear-gradient(180deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.02)),linear-gradient(180deg,_rgba(21,31,38,0.96),_rgba(7,11,16,0.96))] text-sm font-semibold tracking-[0.18em] text-amber-50 sm:h-14 sm:w-14">
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white/92 sm:text-base">{name}</div>
        <div className="truncate text-[0.68rem] uppercase tracking-[0.24em] text-amber-100/62 sm:text-[0.72rem]">
          {title}
        </div>
      </div>

      <div className="grid shrink-0 gap-1 text-right">
        <span className="rounded-full border border-rose-300/16 bg-rose-400/10 px-2 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-rose-100/88">
          {health} HP
        </span>
        <span className="rounded-full border border-emerald-300/16 bg-emerald-400/10 px-2 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-emerald-100/88">
          {energy} EN
        </span>
      </div>
    </div>
  );
}
