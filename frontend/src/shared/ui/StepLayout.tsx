/** 단계 헤더가 상단 전체 폭을 차지하고, 아래에 좌우 50/50 컬럼을 배치하는 위저드 스텝 레이아웃. */
import type { ReactNode } from "react";

interface StepLayoutProps {
  stepLabel: string;
  title: string;
  description: string;
  left: ReactNode;
  right: ReactNode;
}

/**
 * Shared layout for setup/precheck wizard steps.
 * Header (step label + title + description) spans full width at top,
 * then left/right columns below at the same Y position (50/50).
 */
export function StepLayout({ stepLabel, title, description, left, right }: StepLayoutProps) {
  return (
    <div>
      {/* Header — full width */}
      <div className="mb-6">
        <div className="text-[11px] font-bold tracking-[.1em] uppercase text-[#0991B2] mb-2">{stepLabel}</div>
        <h2 className="text-[20px] font-black tracking-[-0.3px] mb-1">{title}</h2>
        <p className="text-[13px] text-[#6B7280]">{description}</p>
      </div>

      {/* Two-column body — same Y start */}
      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
        <div className="flex flex-col gap-4">{left}</div>
        <div className="flex flex-col gap-4">{right}</div>
      </div>
    </div>
  );
}
