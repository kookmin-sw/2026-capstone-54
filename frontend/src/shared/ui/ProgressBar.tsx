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
          <span className="text-[13px] text-[#6B7280]">{label || "진행률"}</span>
          <span className="text-[13px] font-bold text-[#0A0A0A]">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-[#E5E7EB] rounded-full overflow-hidden ${heightStyles[height]}`}>
        <div
          className="h-full bg-gradient-to-r from-[#0991B2] to-[#06B6D4] rounded-full transition-[width] duration-[400ms] ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
