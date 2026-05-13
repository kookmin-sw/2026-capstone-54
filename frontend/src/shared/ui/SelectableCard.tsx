/** 클릭으로 선택 상태를 토글하는 목록형 카드. 우측에 체크 인디케이터를 표시한다. */
import type { ReactNode } from "react";

interface SelectableCardProps {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function SelectableCard({ selected, disabled = false, onClick, children, className = "" }: SelectableCardProps) {
  const base = "flex items-center gap-[11px] p-[12px_14px] rounded-lg border-[1.5px] transition-all";

  const variant = disabled
    ? "cursor-not-allowed opacity-60"
    : selected
    ? "border-mefit-primary bg-mefit-primary-light cursor-pointer"
    : "border-mefit-gray-200 bg-mefit-gray-50 hover:border-mefit-primary cursor-pointer";

  return (
    <div
      className={`${base} ${variant} ${className}`}
      onClick={() => !disabled && onClick()}
    >
      {children}
      <div
        className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center text-[9px] shrink-0 transition-all ${
          selected && !disabled
            ? "bg-mefit-primary border-mefit-primary text-white"
            : "border-mefit-gray-200"
        }`}
      >
        {selected && !disabled ? "✓" : ""}
      </div>
    </div>
  );
}
