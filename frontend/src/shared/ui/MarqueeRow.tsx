import type { CSSProperties, ReactNode } from "react";
import { useReducedMotion } from "@/shared/lib/animation";

interface MarqueeRowProps {
  children: ReactNode;
  direction?: "left" | "right";
  duration?: number;
  pauseOnHover?: boolean;
  gap?: string;
  className?: string;
}

export function MarqueeRow({
  children,
  direction = "left",
  duration = 40,
  pauseOnHover = true,
  gap = "clamp(8px, 1.6vh, 24px)",
  className = "",
}: MarqueeRowProps) {
  const reduced = useReducedMotion();
  const animationName = direction === "left" ? "marqueeLeft" : "marqueeRight";

  const trackStyle: CSSProperties = {
    gap,
    animation: reduced ? undefined : `${animationName} ${duration}s linear infinite`,
  };

  const groupStyle: CSSProperties = { gap };

  const hoverPauseClass = pauseOnHover
    ? "group-hover/marquee:[animation-play-state:paused]"
    : "";

  return (
    <div
      className={`overflow-hidden w-full ${pauseOnHover ? "group/marquee" : ""} ${className}`}
    >
      <div className={`flex w-max ${hoverPauseClass}`} style={trackStyle}>
        <div className="flex shrink-0" style={groupStyle}>
          {children}
        </div>
        <div className="flex shrink-0" style={groupStyle} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
