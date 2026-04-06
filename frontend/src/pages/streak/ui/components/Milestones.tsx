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

interface MilestoneMetadata {
  itemCls: string;
  badgeCls: string;
  tagCls: string;
  tagText: string;
}

function getMilestoneMetadata(status: string, daysRemaining?: number): MilestoneMetadata {
  if (status === "achieved") {
    return {
      itemCls:
        "flex items-center gap-2.5 py-3 px-3.5 rounded-[10px] transition-all bg-[#E6F7FA]",
      badgeCls:
        "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-sm shrink-0 bg-[#0991B2] shadow-[0_2px_8px_rgba(9,145,178,.3)]",
      tagCls:
        "text-[11px] font-bold py-[3px] px-[9px] rounded-full shrink-0 text-[#059669] bg-[#ECFDF5]",
      tagText: "완료",
    };
  }

  if (status === "next") {
    return {
      itemCls:
        "flex items-center gap-2.5 py-3 px-3.5 rounded-[10px] transition-all bg-[rgba(9,145,178,.06)] border-[1.5px] border-dashed border-[rgba(9,145,178,.3)]",
      badgeCls:
        "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-sm shrink-0 bg-[rgba(9,145,178,.12)] border-[1.5px] border-dashed border-[rgba(9,145,178,.4)]",
      tagCls:
        "text-[11px] font-bold py-[3px] px-[9px] rounded-full shrink-0 text-[#0991B2] bg-[#E6F7FA]",
      tagText: `D-${daysRemaining}`,
    };
  }

  return {
    itemCls:
      "flex items-center gap-2.5 py-3 px-3.5 rounded-[10px] transition-all opacity-45 bg-[#F9FAFB] border border-[#E5E7EB]",
    badgeCls:
      "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-sm shrink-0 bg-[#E5E7EB]",
    tagCls:
      "text-[11px] font-bold py-[3px] px-[9px] rounded-full shrink-0 text-[#6B7280] bg-[#F3F4F6]",
    tagText: `${daysRemaining}일 남음`,
  };
}

export function Milestones({ milestones, revealed }: MilestonesProps) {
  return (
    <div
      className={`bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] transition-[box-shadow,transform] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] sk-rv${
        revealed ? " sk-rv-in" : ""
      }`}
      style={{ transitionDelay: "150ms" }}
    >
      <span className="text-[10px] font-bold tracking-[1px] uppercase text-[#0991B2] bg-[#E6F7FA] py-[3px] px-2.5 rounded-full inline-block mb-2.5">
        마일스톤
      </span>
      <h3 className="text-base font-black tracking-[-0.3px] mb-1 text-[#0A0A0A]">
        보상 달성 로드맵
      </h3>
      <p className="text-[13px] text-[#6B7280] mb-[22px] leading-[1.55]">
        스트릭 목표를 달성하면 Pro 기능을 무료로 이용하세요
      </p>
      <div className="flex flex-col gap-2">
        {milestones.map((ms) => {
          const meta = getMilestoneMetadata(ms.status, ms.daysRemaining);
          return (
            <div key={ms.days} className={meta.itemCls}>
              <div className={meta.badgeCls}>
                {ms.status === "achieved" ? "✓" : ms.rewardIcon}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-[#0A0A0A] mb-0.5">{ms.days}일 달성</div>
                <div className="text-[11px] text-[#6B7280] leading-[1.45]">{ms.reward}</div>
              </div>
              <span className={meta.tagCls}>{meta.tagText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
