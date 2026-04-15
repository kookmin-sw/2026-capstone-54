import { Link } from "react-router-dom";

interface StreakHeroProps {
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  rewardsCount: number;
  todayCompleted: boolean;
  nextReward: {
    targetDays: number;
    daysRemaining: number;
    progress: number;
    reward: string;
  };
}

export function StreakHero({
  currentStreak,
  bestStreak,
  totalDays,
  rewardsCount,
  todayCompleted,
  nextReward,
}: StreakHeroProps) {
  return (
    <div className="bg-[#0A0A0A] rounded-2xl relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,.12),0_8px_32px_rgba(0,0,0,.1)] mb-5 animate-[fadeUp_.4s_ease_both] max-sm:rounded-xl">
      {/* Glow effects */}
      <div className="absolute w-[240px] h-[240px] bg-[rgba(9,145,178,.15)] blur-[80px] rounded-full -top-[80px] -right-[40px] pointer-events-none" />
      <div className="absolute w-[160px] h-[160px] bg-[rgba(6,182,212,.08)] blur-[60px] rounded-full -bottom-[40px] -left-[20px] pointer-events-none" />

      {/* Top section: streak count + CTA */}
      <div className="relative z-[1] p-[28px_32px_24px] max-sm:p-[22px_20px_18px]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[40px] leading-none max-sm:text-[32px]">🔥</span>
              <span className="text-[64px] font-black leading-[.85] tracking-[-3px] text-white max-sm:text-[48px]">
                {currentStreak}
              </span>
              <span className="text-[20px] font-bold text-white/40 self-end pb-1 max-sm:text-[16px]">일</span>
            </div>
            <p className="text-[13px] text-white/50 font-medium">
              연속 면접 참여 중 ·{" "}
              <strong className="text-white/80 font-semibold">
                {todayCompleted ? "오늘도 참여 완료 ✓" : "오늘 아직 참여 전"}
              </strong>
            </p>
          </div>
          <Link
            to="/interview/setup"
            className="text-[13px] font-bold text-[#0A0A0A] bg-white rounded-lg py-2.5 px-5 no-underline whitespace-nowrap transition-all hover:bg-[#F3F4F6] hover:-translate-y-0.5 shrink-0 max-sm:w-full max-sm:text-center"
          >
            면접 시작하기 →
          </Link>
        </div>

        {/* Next reward progress */}
        <div className="mt-5 pt-4 border-t border-white/[.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-white/35">
              다음 보상: {nextReward.reward}
            </span>
            <span className="text-[11px] font-bold text-[#67E8F9]">
              {nextReward.daysRemaining}일 남음
            </span>
          </div>
          <div className="h-1.5 bg-white/[.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0991B2] rounded-full [transition:width_1s_cubic-bezier(.34,1.56,.64,1)]"
              style={{ width: `${nextReward.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom stats strip */}
      <div className="relative z-[1] border-t border-white/[.06] grid grid-cols-3 max-sm:grid-cols-3">
        {[
          { label: "최장 기록", value: `${bestStreak}일`, icon: "🏆" },
          { label: "총 참여일", value: `${totalDays}일`, icon: "📅" },
          { label: "보상 수령", value: `${rewardsCount}회`, icon: "🎁" },
        ].map((s, i) => (
          <div
            key={i}
            className={`py-3.5 px-5 text-center max-sm:px-3 max-sm:py-3 ${
              i < 2 ? "border-r border-white/[.06]" : ""
            }`}
          >
            <span className="text-[12px] block mb-0.5">{s.icon}</span>
            <div className="text-[18px] font-black text-white leading-none tracking-[-0.5px] max-sm:text-[16px]">
              {s.value}
            </div>
            <div className="text-[10px] text-white/30 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
