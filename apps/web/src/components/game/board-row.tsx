import CardSlot from "./card-slot";
import { cn } from "@/lib/utils";

type BoardRowProps = {
  slotCount?: number;
  reversed?: boolean;
  size?: "default" | "compact";
};

export default function BoardRow({
  slotCount = 5,
  reversed = false,
  size = "default",
}: BoardRowProps) {
  const slots = Array.from({ length: slotCount });
  const row = reversed ? [...slots].reverse() : slots;

  return (
    <div
      className={cn(
        "grid grid-cols-5",
        size === "compact" ? "gap-2.5 sm:gap-3 lg:gap-4" : "gap-3 sm:gap-4 lg:gap-5",
      )}
    >
      {row.map((_, index) => (
        <CardSlot
          key={index}
          className={cn(
            "aspect-[5/7] w-full min-w-0",
            size === "compact" ? "rounded-[1.45rem]" : "rounded-[1.7rem]",
          )}
        />
      ))}
    </div>
  );
}
