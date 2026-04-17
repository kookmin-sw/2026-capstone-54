export interface Achievement {
  code: string;
  name: string;
  description: string;
  category: "streak" | "activity" | "profile" | "interview" | "other";
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  isAchieved: boolean;
  achievedAt: string | null;
  rewardClaimedAt: string | null;
  canClaimReward: boolean;
}

export interface ClaimResponse {
  achievementCode: string;
  rewardClaimedAt: string;
}

export interface RefreshResponse {
  createdAchievementsCount: number;
}
