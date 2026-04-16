/** 단계 헤더가 상단 전체 폭을 차지하고, 아래에 좌우 50/50 컬럼을 배치하는 위저드 스텝 레이아웃. */
import type { ReactNode } from "react";

interface StepLayoutProps {
  title: string;
  description: string;
  left: ReactNode;
  right: ReactNode;
}

export function StepLayout({ title, description, left, right }: StepLayoutProps) {
  return (
    <div>
      {/* Header — full width */}
      <div className="mb-6">
        <div className="text-[11px] font-bold tracking-[.1em] uppercase text-[#0991B2] mb-2">STEP 2</div>
        <h2 className="text-[20px] font-black tracking-[-0.3px] mb-1">{title}</h2>
        <p className="text-sm text-[#6B7280]">{description}</p>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1 items-stretch">
        <div className="flex flex-col gap-4 h-full">{left}</div>
        <div className="flex flex-col gap-4 h-full">{right}</div>
      </div>
    </div>
  );
}
