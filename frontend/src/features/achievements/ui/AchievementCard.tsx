import { CheckCircle2, Ticket } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import type { Achievement } from "../model/types";

interface AchievementCardProps {
  achievement: Achievement;
  isClaiming: boolean;
  onClaim: (code: string) => void;
}

const categoryLabels: Record<Achievement["category"], string> = {
  streak: "스트릭",
  activity: "활동",
  profile: "프로필",
  interview: "면접",
  other: "기타",
};

const categoryVariants: Record<Achievement["category"], "primary" | "success" | "info" | "warning" | "default"> = {
  streak: "primary",
  activity: "success",
  profile: "info",
  interview: "warning",
  other: "default",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function AchievementCard({ achievement, isClaiming, onClaim }: AchievementCardProps) {
  const {
    code,
    name,
    description,
    category,
    isAchieved,
    achievedAt,
    rewardClaimedAt,
    canClaimReward,
  } = achievement;

  return (
    <div
      className={`p-7 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] flex flex-col gap-3 transition-opacity ${!isAchieved ? "opacity-60" : ""}`}
    >
      {/* Header: name + category badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isAchieved ? (
            <CheckCircle2 size={18} className="text-[#10B981] shrink-0" />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-[#D1D5DB] shrink-0" />
          )}
          <span className={`font-bold text-[14px] truncate ${isAchieved ? "text-[#0A0A0A]" : "text-[#9CA3AF]"}`}>
            {name}
          </span>
        </div>
        <Badge variant={categoryVariants[category]} size="sm" className="shrink-0">
          {categoryLabels[category]}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-[13px] text-[#6B7280] leading-relaxed">{description}</p>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-[#F3F4F6]">
        {isAchieved && achievedAt && !rewardClaimedAt && !canClaimReward && (
          <p className="text-[12px] text-[#9CA3AF]">달성일: {formatDate(achievedAt)}</p>
        )}

        {canClaimReward && (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            loading={isClaiming}
            disabled={isClaiming}
            onClick={() => onClaim(code)}
          >
            보상 수령
          </Button>
        )}

        {rewardClaimedAt && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF]">
            <Ticket size={14} className="text-[#0991B2] shrink-0" />
            <span>수령 완료 · {formatDate(rewardClaimedAt)}</span>
          </div>
        )}

        {!isAchieved && !canClaimReward && !rewardClaimedAt && (
          <p className="text-[12px] text-[#9CA3AF]">아직 달성하지 못한 도전과제입니다</p>
        )}
      </div>
    </div>
  );
}
