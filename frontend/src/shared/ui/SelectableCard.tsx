/** 클릭으로 선택 상태를 토글하는 목록형 카드. 우측에 체크 인디케이터를 표시한다. */
import type { ReactNode } from "react";

interface SelectableCardProps {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * A card that can be clicked to select it.
 * Used for list items like resumes, JDs, etc.
 */
export function SelectableCard({ selected, disabled = false, onClick, children, className = "" }: SelectableCardProps) {
  return (
    <div
      className={`flex items-center gap-[11px] p-[12px_14px] rounded-lg border-[1.5px] transition-all ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${
        selected && !disabled
          ? "border-[#0991B2] bg-[#E6F7FA]"
          : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#0991B2]"
      } ${className}`}
      onClick={() => !disabled && onClick()}
    >
      {children}
      <div
        className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center text-[9px] shrink-0 transition-all ${
          selected && !disabled
            ? "bg-[#0991B2] border-[#0991B2] text-white"
            : "border-[#E5E7EB]"
        }`}
      >
        {selected && !disabled ? "✓" : ""}
      </div>
    </div>
  );
}
