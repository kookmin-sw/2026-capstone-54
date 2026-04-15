/** done/active/pending 상태의 단계를 연결선과 함께 수평으로 표시하는 스텝퍼. */
interface Step {
  label: string;
  state: "done" | "active" | "pending";
}

interface StepIndicatorProps {
  steps: Step[];
  onStepClick?: (index: number) => void;
  dark?: boolean;
  className?: string;
}

export function StepIndicator({ steps, onStepClick, dark = false, className = "" }: StepIndicatorProps) {
  const baseCls = dark
    ? "bg-slate-800/60 border-white/10"
    : "bg-mefit-gray-50 border-mefit-gray-200";

  const getCircleCls = (state: Step["state"]) => {
    if (state === "done")   return "bg-mefit-primary text-white";
    if (state === "active") return dark ? "bg-indigo-600 text-white" : "bg-mefit-black text-white";
    return dark ? "bg-slate-700 text-slate-500" : "bg-mefit-gray-200 text-mefit-gray-400";
  };

  const getLabelCls = (state: Step["state"]) => {
    if (state === "active") return dark ? "text-white font-bold" : "text-mefit-black font-bold";
    if (state === "done")   return dark ? "text-slate-400 font-semibold" : "text-mefit-gray-500 font-semibold";
    return dark ? "text-slate-600 font-semibold" : "text-mefit-gray-400 font-semibold";
  };

  const getLineCls = (done: boolean) =>
    done ? "bg-mefit-primary" : dark ? "bg-slate-700" : "bg-mefit-gray-200";

  return (
    <div className={`flex items-center border rounded-lg p-[14px_22px] shadow-widget ${baseCls} ${className}`}>
      {steps.map((s, i) => (
        <div key={i} className="contents">
          {i > 0 && (
            <div className={`flex-1 h-[1.5px] mx-[10px] transition-colors duration-300 ${getLineCls(s.state === "done" || s.state === "active")}`} />
          )}
          <button
            onClick={() => onStepClick?.(i)}
            disabled={!onStepClick}
            className="flex items-center gap-[7px] shrink-0 bg-transparent border-none p-0 cursor-pointer disabled:cursor-default"
          >
            <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-2xs font-extrabold shrink-0 transition-all ${getCircleCls(s.state)}`}>
              {s.state === "done" ? "✓" : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${getLabelCls(s.state)}`}>{s.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
