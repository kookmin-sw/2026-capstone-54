/** 선택 가능한 필터 칩. selected 상태에 따라 강조 스타일이 적용된다. */
import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  icon?: string;
  className?: string;
}

export function Chip({ children, selected, onClick, onRemove, icon, className = "" }: ChipProps) {
  const base = "inline-flex items-center gap-[6px] px-4 py-[9px] font-plex-sans-kr text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap border";

  const variant = selected
    ? "bg-mefit-primary-light border-mefit-primary text-mefit-primary"
    : "bg-white border-mefit-gray-200 text-mefit-gray-700 hover:border-mefit-primary hover:text-mefit-primary";

  return (
    <button
      type="button"
      className={`${base} ${variant} ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {icon && <span className="text-base">{icon}</span>}
      {children}
      {onRemove && (
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 p-0 text-base leading-none text-mefit-primary bg-transparent border-none cursor-pointer rounded-full transition-colors duration-150 hover:bg-mefit-primary-ring"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="제거"
        >
          ×
        </button>
      )}
    </button>
  );
}
