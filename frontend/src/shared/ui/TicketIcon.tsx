import { useState } from "react";

interface TicketIconProps {
  count: number;
  type: "daily" | "bonus";
  size?: number;
  dailyAmount?: number;
}

const DAILY_TOOLTIP = (amount: number) =>
  `매일 ${amount}개씩 충전되는 일일 티켓입니다. 먼저 사용되며, 전부 소진하면 충전/보상 티켓이 차감됩니다.`;

const BONUS_TOOLTIP =
  "구입하거나 보상으로 받은 티켓입니다. 매일 초기화되지 않으며, 일일 티켓 사용 후 남은 경우 차감됩니다.";

export function TicketIcon({ count, type, size = 16, dailyAmount }: TicketIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = type === "daily" ? "#059669" : "#7C3AED";
  const bgColor = type === "daily" ? "#D1FAE5" : "#EDE9FE";
  const tooltipText =
    type === "daily"
      ? dailyAmount
        ? DAILY_TOOLTIP(dailyAmount)
        : "매일 충전되는 티켓입니다."
      : BONUS_TOOLTIP;

  return (
    <div className="relative inline-flex items-center gap-1">
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className="flex items-center justify-center rounded cursor-help"
          style={{
            width: size + 10,
            height: size + 6,
            backgroundColor: bgColor,
            padding: "2px",
          }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        </div>
        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 rounded-lg bg-gray-800 text-white text-xs leading-[1.5] font-medium whitespace-normal w-[220px] shadow-lg z-50 pointer-events-none">
            {tooltipText}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-6px] border-4 border-transparent border-b-gray-800" />
          </div>
        )}
      </div>
      <span className="text-xs font-bold" style={{ color, lineHeight: 1 }}>
        {count}
      </span>
    </div>
  );
}
