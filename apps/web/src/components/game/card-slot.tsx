import type { CSSProperties, PointerEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardSlotProps = {
  className?: string;
  children?: ReactNode;
  hidden?: boolean;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  revealed?: boolean;
  slotRef?: (node: HTMLDivElement | null) => void;
  style?: CSSProperties;
  transitionDelayMs?: number;
};

export default function CardSlot({
  className,
  children,
  hidden = false,
  onPointerDown,
  revealed = true,
  slotRef,
  style,
  transitionDelayMs = 0,
}: CardSlotProps) {
  return (
    <div
      ref={slotRef}
      aria-hidden={hidden || !revealed}
      data-revealed={revealed ? "true" : "false"}
      onPointerDown={onPointerDown}
      className={cn(
        "card-slot overflow-hidden transition-[opacity,transform,filter,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        hidden && "card-slot-hidden",
        revealed ? "translate-y-0 scale-100 opacity-100 blur-0" : "translate-y-4 scale-[0.88] opacity-0 blur-[1px]",
        className,
      )}
      style={{ transitionDelay: `${transitionDelayMs}ms`, ...style }}
    >
      {children}
    </div>
  );
}
