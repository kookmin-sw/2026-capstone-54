import type { Milestone } from "../api/types";

interface MilestoneCardProps {
  milestone: Milestone;
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

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const s = getStyles(milestone.status);
  const tagText =
    milestone.status === "achieved"
      ? "완료"
      : milestone.status === "next"
      ? `D-${milestone.daysRemaining}`
      : milestone.daysRemaining !== undefined
      ? `${milestone.daysRemaining}일`
      : "잠금";

  return (
    <div className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg transition-all ${s.row}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${s.badge}`}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={milestone.status === "achieved" ? "#ffffff" : "#7C3AED"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-[#0A0A0A]">{milestone.days}일</div>
        <div className="text-[10px] text-[#6B7280] leading-[1.4] truncate">{milestone.reward}</div>
      </div>
      <span className={`text-[10px] font-bold py-[2px] px-2 rounded-full shrink-0 ${s.tag}`}>
        {tagText}
      </span>
    </div>
  );
}
