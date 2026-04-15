interface RewardHistoryItem {
  id: string;
  icon: string;
  iconBg: "cyan" | "green" | "amber";
  title: string;
  description: string;
  date: string;
}

interface RewardHistoryProps {
  rewardHistory: RewardHistoryItem[];
  revealed: boolean;
}

const BG_MAP = { cyan: "#0991B2", green: "#059669", amber: "#D97706" };

export function RewardHistory({ rewardHistory, revealed }: RewardHistoryProps) {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "130ms" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-sm">🎁</span>
        <h3 className="text-[14px] font-bold text-[#0A0A0A]">보상 수령 이력</h3>
      </div>

      {rewardHistory.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-[28px] block mb-2">📦</span>
          <p className="text-[12px] text-[#9CA3AF] font-medium">아직 수령한 보상이 없어요</p>
          <p className="text-[11px] text-[#D1D5DB] mt-1">마일스톤을 달성하면 보상이 지급됩니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rewardHistory.map((rh) => (
            <div
              key={rh.id}
              className="flex items-center gap-3 py-2.5 px-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg transition-all hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-px"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0"
                style={{ background: BG_MAP[rh.iconBg] }}
              >
                {rh.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-[#0A0A0A] truncate">{rh.title}</div>
                <div className="text-[10px] text-[#6B7280]">{rh.description} · {rh.date}</div>
              </div>
              <span className="text-[10px] font-bold text-[#0991B2] bg-[#E6F7FA] py-[2px] px-2 rounded-full shrink-0">
                수령
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
