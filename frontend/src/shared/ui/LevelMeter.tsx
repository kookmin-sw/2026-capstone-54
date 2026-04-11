/** 레이블과 프로그레스 바와 수치 텍스트로 구성된 측정 표시기. */
interface LevelMeterProps {
  icon: string;
  label: string;
  value: number;
  max?: number;
  color?: string;
  displayText: string;
  className?: string;
}

export function LevelMeter({ icon, label, value, max = 100, color = "#10B981", displayText, className = "" }: LevelMeterProps) {
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${className}`}>
      <div className="text-[11px] font-bold text-[#6B7280] mb-[9px] flex items-center gap-[5px]">{icon} {label}</div>
      <div className="h-[5px] rounded-[3px] bg-[#E5E7EB] overflow-hidden mb-[5px]">
        <div className="h-full rounded-[3px] [transition:width_1s_ease]" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="text-[11px] font-bold text-[#0A0A0A]">{displayText}</div>
    </div>
  );
}
