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
      <div className="text-[15px] font-extrabold text-[#0A0A0A] mb-1 flex items-center gap-2">
        {icon && (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0"
            style={gradient ? { background: gradient } : undefined}
          >
            {icon}
          </span>
        )}
        {title}
      </div>
      {description && <p className="text-[13px] text-[#6B7280] mb-[18px] ml-9">{description}</p>}
      {children}
    </div>
  );
}
