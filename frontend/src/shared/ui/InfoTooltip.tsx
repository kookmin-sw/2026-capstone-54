/** 호버 시 설명 툴팁이 나타나는 원형 정보 아이콘. */
import { useState } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  text: string;
  className?: string;
}

export function InfoTooltip({ text, className = "" }: InfoTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="w-[18px] h-[18px] rounded-full border border-[#D1D5DB] bg-white flex items-center justify-center cursor-help hover:border-[#0991B2] hover:bg-[#E6F7FA] transition-colors">
        <Info size={11} className="text-[#9CA3AF]" />
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[#1F2937] text-white text-[11px] leading-[1.5] font-medium whitespace-normal w-[220px] shadow-lg z-50 pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1F2937]" />
        </span>
      )}
    </span>
  );
}
