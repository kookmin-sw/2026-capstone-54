/** 아이콘과 제목과 우측 액션 슬롯으로 구성된 섹션 헤더. */
import type { ReactNode } from "react";

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function SectionHeader({ icon, title, description, children }: SectionHeaderProps) {
  return (
    <div className="mb-4">
      <div className="text-md font-extrabold text-mefit-black mb-1 flex items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        {title}
      </div>
      {description && <p className="text-sm text-mefit-gray-500 mb-[18px] ml-9">{description}</p>}
      {children}
    </div>
  );
}
