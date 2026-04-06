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

function getIconBgStyle(bg: "cyan" | "green" | "amber") {
  if (bg === "cyan") return { background: "#0991B2" };
  if (bg === "green") return { background: "#059669" };
  return { background: "#D97706" };
}

export function RewardHistory({ rewardHistory, revealed }: RewardHistoryProps) {
  return (
    <div
      className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] transition-[box-shadow,transform] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "130ms" }}
    >
      <span className="text-[10px] font-bold tracking-[1px] uppercase text-[#0991B2] bg-[#E6F7FA] py-[3px] px-2.5 rounded-full inline-block mb-2.5">
        보상 내역
      </span>
      <h2 className="text-[18px] font-black tracking-[-0.3px] mb-1 text-[#0A0A0A]">
        스트릭 보상 수령 이력
      </h2>
      <p className="text-[13px] text-[#6B7280] mb-[22px] leading-[1.55]">
        마일스톤 달성 시 Pro 기능 사용권이 자동 지급됩니다
      </p>
      <div className="flex flex-col gap-2">
        {rewardHistory.map((rh) => (
          <div
            key={rh.id}
            className="flex items-center gap-3 py-3 px-3.5 bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-px"
          >
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center text-base shrink-0"
              style={getIconBgStyle(rh.iconBg)}
            >
              {rh.icon}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold mb-0.5 text-[#0A0A0A]">{rh.title}</div>
              <div className="text-[11px] text-[#6B7280]">
                {rh.description} · {rh.date}
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#0991B2] bg-[#E6F7FA] py-[3px] px-[9px] rounded-full whitespace-nowrap">
              수령 완료
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
