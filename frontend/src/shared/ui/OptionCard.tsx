/** 아이콘, 뱃지, 태그를 포함할 수 있는 선택형 옵션 카드. 면접 방식이나 난이도 선택에 사용한다. */
import type { ReactNode } from "react";

interface OptionCardProps {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  badge?: ReactNode;
  tags?: string[];
  children?: ReactNode;
  className?: string;
}

export function OptionCard({
  selected, disabled = false, onClick,
  icon, title, description, badge, tags, children, className = "",
}: OptionCardProps) {
  const base = "rounded-lg p-4 border-[1.5px] transition-all";

  const variant = disabled
    ? "border-mefit-gray-200 bg-mefit-gray-50 opacity-45 cursor-not-allowed"
    : selected
    ? "border-mefit-primary bg-mefit-primary-light cursor-pointer"
    : "border-mefit-gray-200 bg-mefit-gray-50 hover:border-mefit-primary cursor-pointer";

  return (
    <div
      className={`${base} ${variant} ${className}`}
      onClick={() => !disabled && onClick()}
    >
      {(icon || badge) && (
        <div className="flex items-center justify-between mb-2">
          {icon && <span className="flex items-center">{icon}</span>}
          {badge}
        </div>
      )}
      <div className="text-sm font-extrabold mb-1">{title}</div>
      {description && <div className="text-xs text-mefit-gray-500 leading-[1.45]">{description}</div>}
      {tags && tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {tags.map((t) => (
            <span key={t} className="text-[10px] font-semibold text-mefit-primary bg-mefit-primary-ring py-0.5 px-[7px] rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
