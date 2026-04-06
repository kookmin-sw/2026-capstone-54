interface StreakStatsProps {
  bestStreak: number;
  totalDays: number;
  rewardsCount: number;
  revealed: boolean;
}

export function StreakStats({ bestStreak, totalDays, rewardsCount, revealed }: StreakStatsProps) {
  const stats = [
    { icon: "🏆", value: bestStreak, label: "최장 연속 기록", accent: true },
    { icon: "📅", value: totalDays, label: "총 참여일", accent: false },
    { icon: "🎁", value: rewardsCount, label: "보상 수령 횟수", accent: false },
  ];

  return (
    <div className="grid grid-cols-3 gap-3.5 mb-5 animate-[skFadeUp_.45s_ease_.06s_both]">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl py-[22px] px-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] text-center transition-[box-shadow,transform] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[3px] sk-rv${
            revealed ? " sk-rv-in" : ""
          }`}
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          <span className="text-[24px] block mb-2">{s.icon}</span>
          <span
            className={`text-[36px] font-black tracking-[-1px] leading-none block mb-1 ${
              s.accent ? "text-[#0991B2]" : "text-[#0A0A0A]"
            }`}
          >
            {s.value}
          </span>
          <span className="text-[12px] text-[#6B7280] font-semibold">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
