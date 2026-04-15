/** 아이콘과 제목과 우측 액션 슬롯으로 구성된 섹션 헤더. */
import type { ReactNode } from "react";

interface SectionHeaderProps {
  icon?: string;
  title: string;
  description?: string;
  gradient?: string;
  children?: ReactNode;
}

export function SectionHeader({ icon, title, description, gradient, children }: SectionHeaderProps) {
  return (
    <div className="mb-4">
      <div className="text-md font-extrabold text-mefit-black mb-1 flex items-center gap-2">
        {icon && (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={gradient ? { background: gradient } : undefined}
          >
            {icon}
          </span>
        )}
        {title}
      </div>
      {description && <p className="text-sm text-mefit-gray-500 mb-[18px] ml-9">{description}</p>}
      {children}
    </div>
  );
}
