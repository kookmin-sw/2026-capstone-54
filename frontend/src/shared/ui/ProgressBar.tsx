/** 진행률을 시각적으로 표시하는 수평 바. 라벨 표시를 선택할 수 있다. */
interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
  height?: "sm" | "md";
}

const heightStyles = {
  sm: "h-[5px]",
  md: "h-[6px]",
};

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  className = "",
  height = "md",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-mefit-gray-500">{label || "진행률"}</span>
          <span className="text-sm font-bold text-mefit-black">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-mefit-gray-200 rounded-full overflow-hidden ${heightStyles[height]}`}>
        <div
          className="h-full bg-gradient-to-r from-mefit-primary to-mefit-primary-mid rounded-full transition-[width] duration-[400ms] ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
