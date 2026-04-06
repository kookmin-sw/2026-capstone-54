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
  const baseStyles = "inline-flex items-center gap-[6px] px-4 py-[9px] font-inter text-[13px] font-semibold rounded-lg transition-all duration-200 whitespace-nowrap border";
  
  const variantStyles = selected
    ? "bg-[#E6F7FA] border-[#0991B2] text-[#0991B2]"
    : "bg-white border-[#E5E7EB] text-[#374151] hover:border-[#0991B2] hover:text-[#0991B2]";

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles} ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {icon && <span className="text-[14px]">{icon}</span>}
      {children}
      {onRemove && (
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 p-0 text-[14px] leading-none text-[#0991B2] bg-none border-none cursor-pointer rounded-full transition-[background] duration-150 hover:bg-[rgba(9,145,178,0.15)]"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="제거"
        >
          ×
        </button>
      )}
    </button>
  );
}
