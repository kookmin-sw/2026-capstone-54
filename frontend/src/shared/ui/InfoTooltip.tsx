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
      <span className="w-[18px] h-[18px] rounded-full border border-mefit-gray-300 bg-white flex items-center justify-center cursor-help hover:border-mefit-primary hover:bg-mefit-primary-light transition-colors">
        <Info size={11} className="text-mefit-gray-400" />
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-mefit-gray-800 text-white text-2xs leading-[1.5] font-medium whitespace-normal w-[220px] shadow-lg z-50 pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-mefit-gray-800" />
        </span>
      )}
    </span>
  );
}
