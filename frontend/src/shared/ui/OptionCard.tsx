/** 아이콘, 뱃지, 태그를 포함할 수 있는 선택형 옵션 카드. 면접 방식이나 난이도 선택에 사용한다. */
import type { ReactNode } from "react";

interface OptionCardProps {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  tags?: string[];
  children?: ReactNode;
  className?: string;
}

/**
 * A styled option card used for selecting modes, difficulty levels, etc.
 * Supports icon, badge, tags, and custom children.
 */
export function OptionCard({
  selected, disabled = false, onClick,
  icon, title, description, badge, tags, children, className = "",
}: OptionCardProps) {
  return (
    <div
      className={`rounded-lg p-4 border-[1.5px] transition-all ${
        disabled
          ? "border-[#E5E7EB] bg-[#F9FAFB] opacity-45 cursor-not-allowed"
          : selected
          ? "border-[#0991B2] bg-[#E6F7FA] cursor-pointer"
          : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#0991B2] cursor-pointer"
      } ${className}`}
      onClick={() => !disabled && onClick()}
    >
      {(icon || badge) && (
        <div className="flex items-center justify-between mb-2">
          {icon && <span className="text-[20px]">{icon}</span>}
          {badge}
        </div>
      )}
      <div className="text-[13px] font-extrabold mb-1">{title}</div>
      {description && <div className="text-[12px] text-[#6B7280] leading-[1.45]">{description}</div>}
      {tags && tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {tags.map((t) => (
            <span key={t} className="text-[10px] font-semibold text-[#0991B2] bg-[rgba(9,145,178,.1)] py-0.5 px-[7px] rounded-full">{t}</span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
