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

/** 페이지네이션 API 응답 */
export interface PaginatedAchievements {
  results: Achievement[];
  total: number;
  limit: number;
  offset: number;
}

/** 필터 상태 */
export interface FilterState {
  category: string | null;
  status: string | null;
  rewardClaim: string | null;
}
