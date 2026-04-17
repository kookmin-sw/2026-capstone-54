export interface Achievement {
  code: string;
  name: string;
  description: string;
  category: "streak" | "activity" | "profile" | "interview" | "other";
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  is_achieved: boolean;
  achieved_at: string | null;
  reward_claimed_at: string | null;
  can_claim_reward: boolean;
}

export interface ClaimResponse {
  achievement_code: string;
  reward_claimed_at: string;
}

export interface RefreshResponse {
  created_achievements_count: number;
}
