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
      className={`bg-[#0A0A0A] rounded-xl p-[26px] relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,.16),0_12px_40px_rgba(0,0,0,.1)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "100ms" }}
    >
      <div className="absolute w-[200px] h-[200px] bg-[rgba(9,145,178,.12)] blur-[60px] rounded-full -top-[60px] -right-[40px] pointer-events-none" />
      <div className="relative z-[1]">
        <div className="text-[10px] font-bold tracking-[1px] uppercase text-white/35 mb-3.5">
          다음 보상까지
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-[34px] font-black text-white tracking-[-1px] leading-none">
            {nextReward.targetDays}
            <span className="text-sm font-bold text-white/40 ml-[3px]">일 달성 목표</span>
          </div>
          <div className="text-[12px] font-bold text-white/45">{nextReward.daysRemaining}일 남음</div>
        </div>
        <div className="h-2 bg-white/[.1] rounded-full overflow-hidden my-3.5">
          <div
            className="h-full bg-[#0991B2] rounded-full [transition:width_1s_cubic-bezier(.34,1.56,.64,1)]"
            style={{ width: `${nextReward.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/35">
            {currentStreak} / {nextReward.targetDays}일 완료
          </span>
          <div className="flex items-center gap-[5px] bg-[rgba(9,145,178,.25)] border border-[rgba(9,145,178,.4)] rounded-full py-1 px-2.5 text-[12px] font-bold text-[#67E8F9]">
            🎁 {nextReward.reward}
          </div>
        </div>
        <div className="mt-4 pt-3.5 border-t border-white/[.07]">
          <p className="text-[12px] text-white/35 leading-[1.65]">{nextReward.rewardDetail}</p>
        </div>
      </div>
    </div>
  );
}
