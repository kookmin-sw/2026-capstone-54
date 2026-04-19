import { Medal } from "lucide-react";

interface Milestone {
  days: number;
  reward: string;
  rewardIcon: string;
  status: "achieved" | "next" | "locked";
  daysRemaining?: number;
}

interface MilestonesProps {
  milestones: Milestone[];
  revealed: boolean;
}

function getStyles(status: Milestone["status"]) {
  if (status === "achieved") {
    return {
      row: "bg-[#E6F7FA]",
      badge: "bg-[#0991B2] text-white shadow-[0_1px_4px_rgba(9,145,178,.3)]",
      tag: "text-[#059669] bg-[#ECFDF5]",
    };
  }
  if (status === "next") {
    return {
      row: "bg-[rgba(9,145,178,.04)] border border-dashed border-[rgba(9,145,178,.25)]",
      badge: "bg-[rgba(9,145,178,.1)] border border-dashed border-[rgba(9,145,178,.35)]",
      tag: "text-[#0991B2] bg-[#E6F7FA]",
    };
  }
  return {
    row: "bg-[#F9FAFB] border border-[#E5E7EB] opacity-50",
    badge: "bg-[#E5E7EB]",
    tag: "text-[#6B7280] bg-[#F3F4F6]",
  };
}

export function Milestones({ milestones, revealed }: MilestonesProps) {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "150ms" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
          <Medal size={14} className="text-[#F97316]" />
        </span>
        <h3 className="text-[14px] font-bold text-[#0A0A0A]">마일스톤</h3>
      </div>

      <div className="flex flex-col gap-2">
        {milestones.map((ms) => {
          const s = getStyles(ms.status);
          const tagText =
            ms.status === "achieved"
              ? "완료"
              : ms.status === "next"
              ? `D-${ms.daysRemaining}`
              : ms.daysRemaining !== undefined
              ? `${ms.daysRemaining}일`
              : "잠금";

          return (
            <div key={ms.days} className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg transition-all ${s.row}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${s.badge}`}>
                {ms.status === "achieved" ? "✓" : ms.rewardIcon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-[#0A0A0A]">{ms.days}일</div>
                <div className="text-[10px] text-[#6B7280] leading-[1.4] truncate">{ms.reward}</div>
              </div>
              <span className={`text-[10px] font-bold py-[2px] px-2 rounded-full shrink-0 ${s.tag}`}>
                {tagText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
