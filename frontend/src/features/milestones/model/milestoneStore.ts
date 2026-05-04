import { create } from "zustand";
import { fetchMilestonesApi } from "../api/milestoneApi";
import type { MilestoneState } from "./types";

export const useMilestoneStore = create<MilestoneState>()((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchMilestones: async () => {
    set({ loading: true, error: null });
    const res = await fetchMilestonesApi();
    if (res.success && res.data) {
      set({ data: res.data, loading: false });
    } else {
      set({ error: res.error ?? "마일스톤을 불러오지 못했습니다.", loading: false });
    }
  },

  setFallbackData: (data) => set({ data }),
}));
