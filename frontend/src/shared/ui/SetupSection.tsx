/** eyebrow 라벨 + 제목 + 설명을 가진 설정 폼 섹션 컨테이너. */
import type { ReactNode } from "react";

interface SetupSectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

const sectionCls = "bg-white border border-mefit-gray-200 rounded-lg p-6 shadow-md flex flex-col";

export function SetupSection({ eyebrow, title, description, children, className = "" }: SetupSectionProps) {
  return (
    <div className={`${sectionCls} ${className}`}>
      <span className="text-[10px] font-bold tracking-[.1em] uppercase text-mefit-primary mb-2.5 block">
        {eyebrow}
      </span>
      <div className="text-md font-extrabold mb-[3px]">{title}</div>
      {description && (
        <div className="text-sm text-mefit-gray-500 mb-3.5 leading-[1.5]">{description}</div>
      )}
      {children}
    </div>
  );
}
