/** 단계 헤더가 상단 전체 폭을 차지하고, 아래에 좌우 50/50 컬럼을 배치하는 위저드 스텝 레이아웃. */
import type { ReactNode } from "react";

interface StepLayoutProps {
  stepLabel?: string;
  title: string;
  description: string;
  left: ReactNode;
  right: ReactNode;
}

export function StepLayout({ stepLabel, title, description, left, right }: StepLayoutProps) {
  return (
    <div>
      {/* Header — full width */}
      <div className="mb-6">
        {stepLabel && <div className="text-[11px] font-bold tracking-[.1em] uppercase text-mefit-primary mb-2">{stepLabel}</div>}
        <h2 className="text-[20px] font-black tracking-[-0.3px] mb-1">{title}</h2>
        <p className="text-sm text-mefit-gray-500">{description}</p>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1 items-stretch">
        <div className="flex flex-col gap-4 min-h-[400px] max-h-[520px]">{left}</div>
        <div className="flex flex-col gap-4 min-h-[400px] max-h-[520px]">{right}</div>
      </div>
    </div>
  );
}
