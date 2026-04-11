/** eyebrow 라벨 + 제목 + 설명을 가진 설정 폼 섹션 컨테이너. */
import type { ReactNode } from "react";

interface SetupSectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

const sectionCls = "bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] flex flex-col";

export function SetupSection({ eyebrow, title, description, children, className = "" }: SetupSectionProps) {
  return (
    <div className={`${sectionCls} ${className}`}>
      <span className="text-[10px] font-bold tracking-[.1em] uppercase text-[#0991B2] mb-2.5 block">{eyebrow}</span>
      <div className="text-[15px] font-extrabold mb-[3px]">{title}</div>
      {description && <div className="text-[13px] text-[#6B7280] mb-3.5 leading-[1.5]">{description}</div>}
      {children}
    </div>
  );
}
