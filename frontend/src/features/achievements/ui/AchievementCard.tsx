import { CheckCircle2, Ticket } from "lucide-react";
import { Card } from "@/shared/ui/Card";
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
    is_achieved,
    achieved_at,
    reward_claimed_at,
    can_claim_reward,
  } = achievement;

  return (
    <Card
      padding="sm"
      className={`flex flex-col gap-3 transition-opacity ${!is_achieved ? "opacity-60" : ""}`}
    >
      {/* Header: name + category badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {is_achieved && (
            <CheckCircle2 size={18} className="text-mefit-success shrink-0" />
          )}
          {!is_achieved && (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-mefit-gray-300 shrink-0" />
          )}
          <span className={`font-bold text-sm truncate ${is_achieved ? "text-mefit-black" : "text-mefit-gray-400"}`}>
            {name}
          </span>
        </div>
        <Badge variant={categoryVariants[category]} size="sm" className="shrink-0">
          {categoryLabels[category]}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-xs text-mefit-gray-500 leading-relaxed">{description}</p>

      {/* Footer: achieved date / claim button / claimed status */}
      <div className="mt-auto pt-1">
        {is_achieved && achieved_at && !reward_claimed_at && !can_claim_reward && (
          <p className="text-xs text-mefit-gray-400">달성일: {formatDate(achieved_at)}</p>
        )}

        {can_claim_reward && (
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

        {reward_claimed_at && (
          <div className="flex items-center gap-1.5 text-xs text-mefit-gray-400">
            <Ticket size={14} className="text-mefit-primary shrink-0" />
            <span>수령 완료 · {formatDate(reward_claimed_at)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
