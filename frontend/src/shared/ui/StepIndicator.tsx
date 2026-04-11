/** done/active/pending 상태의 단계를 연결선과 함께 수평으로 표시하는 스텝퍼. */
interface Step {
  label: string;
  state: "done" | "active" | "pending";
}

interface StepIndicatorProps {
  steps: Step[];
  onStepClick?: (index: number) => void;
  className?: string;
}

export function StepIndicator({ steps, onStepClick, className = "" }: StepIndicatorProps) {
  return (
    <div className={`flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-[14px_22px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${className}`}>
      {steps.map((s, i) => {
        const circleCls =
          s.state === "done"
            ? "bg-[#0991B2] text-white"
            : s.state === "active"
            ? "bg-[#0A0A0A] text-white"
            : "bg-[#E5E7EB] text-[#9CA3AF]";
        const labelCls =
          s.state === "active"
            ? "text-[#0A0A0A] font-bold"
            : s.state === "done"
            ? "text-[#6B7280] font-semibold"
            : "text-[#9CA3AF] font-semibold";

        // Line color: colored if the step AFTER the line is done or active
        const lineDone = s.state === "done" || s.state === "active";

        return (
          <div key={i} className="contents">
            {/* Connecting line (between steps) */}
            {i > 0 && (
              <div className={`flex-1 h-[1.5px] mx-[10px] transition-colors duration-300 ${lineDone ? "bg-[#0991B2]" : "bg-[#E5E7EB]"}`} />
            )}

            {/* Step circle + label */}
            <button
              onClick={() => onStepClick?.(i)}
              disabled={!onStepClick}
              className="flex items-center gap-[7px] shrink-0 bg-transparent border-none p-0 cursor-pointer disabled:cursor-default"
            >
              <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all ${circleCls}`}>
                {s.state === "done" ? "✓" : i + 1}
              </div>
              <span className={`text-[12px] whitespace-nowrap ${labelCls}`}>{s.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
