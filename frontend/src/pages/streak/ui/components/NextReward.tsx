import { Target, Gift } from "lucide-react";

interface NextRewardData {
  targetDays: number;
  daysRemaining: number;
  progress: number;
  reward: string;
  rewardDetail: string;
}

interface NextRewardProps {
  nextReward: NextRewardData;
  currentStreak: number;
  revealed: boolean;
}

export function NextReward({ nextReward, currentStreak, revealed }: NextRewardProps) {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "100ms" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-[#E6F7FA] flex items-center justify-center">
          <Target size={14} className="text-[#0991B2]" />
        </span>
        <h3 className="text-[14px] font-bold text-[#0A0A0A]">다음 목표</h3>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-[28px] font-black text-[#0A0A0A] tracking-[-1px] leading-none">
          {nextReward.targetDays}일
        </span>
        <span className="text-[12px] font-medium text-[#6B7280]">달성 목표</span>
      </div>

      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden my-3">
        <div
          className="h-full bg-[#0991B2] rounded-full [transition:width_1s_cubic-bezier(.34,1.56,.64,1)]"
          style={{ width: `${nextReward.progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#9CA3AF] font-medium">
          {currentStreak} / {nextReward.targetDays}일
        </span>
        <span className="text-[11px] font-bold text-[#0991B2] bg-[#E6F7FA] py-[3px] px-2 rounded-full flex items-center gap-1">
          <Gift size={10} className="text-[#0991B2]" />
          {nextReward.reward}
        </span>
      </div>

      <p className="text-[11px] text-[#9CA3AF] leading-[1.6] mt-3 pt-3 border-t border-[#F3F4F6]">
        {nextReward.rewardDetail}
      </p>
    </div>
  );
}
