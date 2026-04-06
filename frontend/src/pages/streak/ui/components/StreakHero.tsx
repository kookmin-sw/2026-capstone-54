interface StreakHeroProps {
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  rewardsCount: number;
  todayCompleted: boolean;
}

export function StreakHero({
  currentStreak,
  bestStreak,
  totalDays,
  rewardsCount,
  todayCompleted,
}: StreakHeroProps) {
  return (
    <div className="bg-[#0A0A0A] rounded-2xl p-[40px_44px] relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,.18),0_16px_48px_rgba(0,0,0,.12)] mb-5 animate-[skFadeUp_.45s_ease_both] max-[960px]:p-7 max-sm:rounded-xl max-sm:p-[22px_20px]">
      <div className="absolute w-[300px] h-[300px] bg-[rgba(9,145,178,.12)] blur-[80px] rounded-full -top-[100px] -right-[60px] pointer-events-none" />
      <div className="absolute w-[200px] h-[200px] bg-[rgba(6,182,212,.08)] blur-[60px] rounded-full -bottom-[60px] -left-[40px] pointer-events-none" />
      <div className="relative z-[1] flex items-center gap-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.2px] uppercase text-white/45 bg-white/[.08] py-1 px-3 rounded-full mb-[18px]">
            🔥 스트릭 현황
          </div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-[56px] leading-none animate-[skFlicker_3s_ease-in-out_infinite] max-[960px]:text-[44px] max-sm:text-[40px]">
              🔥
            </span>
            <span className="text-[96px] font-black leading-[.9] tracking-[-4px] text-white max-[960px]:text-[72px] max-sm:text-[60px]">
              {currentStreak}
            </span>
            <span className="text-[28px] font-bold text-white/45 self-end pb-2.5">일</span>
          </div>
          <p className="text-[15px] text-white/55 font-medium mb-5">
            연속 면접 참여 중 ·{" "}
            <strong className="text-white font-bold">
              {todayCompleted ? "오늘도 참여했어요!" : "오늘 아직 참여 전이에요"}
            </strong>
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="bg-[rgba(9,145,178,.25)] border border-[rgba(9,145,178,.45)] text-[#67E8F9] text-[12px] font-bold py-1.5 px-3.5 rounded-full">
              🏆 역대 최장 {bestStreak}일
            </span>
            <span className="bg-white/[.08] border border-white/[.12] text-white/70 text-[12px] font-bold py-1.5 px-3.5 rounded-full">
              총 {totalDays}일 참여
            </span>
            <span className="bg-white/[.08] border border-white/[.12] text-white/70 text-[12px] font-bold py-1.5 px-3.5 rounded-full">
              보상 {rewardsCount}회 수령
            </span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-3.5 items-end max-[960px]:hidden">
          <div className="w-[148px] h-[148px] bg-[rgba(9,145,178,.15)] border border-[rgba(9,145,178,.25)] rounded-full flex items-center justify-center text-[60px] animate-[skBreathe_3s_ease-in-out_infinite] shadow-[0_0_48px_rgba(9,145,178,.2)]">
            🔥
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-white/[.07] border border-white/[.08] rounded-[10px] py-2.5 px-4 text-right">
              <div className="text-[20px] font-black text-white leading-none">{bestStreak}일</div>
              <div className="text-[10px] text-white/35 mt-0.5 font-semibold">최장 기록</div>
            </div>
            <div className="bg-white/[.07] border border-white/[.08] rounded-[10px] py-2.5 px-4 text-right">
              <div className="text-[20px] font-black text-white leading-none">{totalDays}일</div>
              <div className="text-[10px] text-white/35 mt-0.5 font-semibold">총 참여일</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
