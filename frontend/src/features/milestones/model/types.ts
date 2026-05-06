import type { Milestone } from "../api/types";

export interface MilestoneState {
  data: Milestone[] | null;
  loading: boolean;
  error: string | null;
  fetchMilestones: () => Promise<void>;
  setFallbackData: (data: Milestone[]) => void;
}
