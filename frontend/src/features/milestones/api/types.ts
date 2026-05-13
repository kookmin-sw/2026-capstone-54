/** 마일스톤 API 응답 타입. */
export interface Milestone {
  id?: number;
  days: number;
  name?: string;
  description?: string;
  reward: string;
  rewardIcon: string;
  status: "achieved" | "next" | "locked";
  daysRemaining?: number;
}
