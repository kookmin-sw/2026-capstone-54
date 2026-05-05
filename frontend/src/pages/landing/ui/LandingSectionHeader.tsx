import type { ReactNode } from "react";

interface LandingSectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  spacing?: "tight" | "normal" | "loose";
  className?: string;
}

const ALIGN_CLASS: Record<NonNullable<LandingSectionHeaderProps["align"]>, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
};

const SPACING_CLASS: Record<NonNullable<LandingSectionHeaderProps["spacing"]>, string> = {
  tight: "mb-[clamp(12px,2vh,32px)]",
  normal: "mb-[clamp(16px,3vh,48px)]",
  loose: "mb-[clamp(20px,4vh,64px)]",
};

export function LandingSectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  spacing = "normal",
  className = "",
}: LandingSectionHeaderProps) {
  return (
    <div
      data-section-header
      className={`flex flex-col ${ALIGN_CLASS[align]} ${SPACING_CLASS[spacing]} ${className}`}
    >
      {eyebrow && (
        <div className="inline-block font-bold text-[#0991B2] bg-[#E6F7FA] rounded text-[clamp(10px,calc(0.8vh+0.3vw),15px)] px-[clamp(10px,calc(1vh+0.5vw),22px)] py-[clamp(3px,0.6vh,8px)] mb-[clamp(8px,1.5vh,20px)]">
          {eyebrow}
        </div>
      )}
      <h2 className="font-plex-sans-kr font-extrabold text-[#0A0A0A] leading-[1.15] tracking-[-0.5px] text-[clamp(22px,calc(2.4vh+2.6vw),72px)] md:leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[#6B7280] leading-[1.55] text-[clamp(11px,calc(1vh+0.5vw),20px)] mt-[clamp(6px,1.2vh,20px)] md:leading-[1.65]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
