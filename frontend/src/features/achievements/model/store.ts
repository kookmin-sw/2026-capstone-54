import { create } from "zustand";
import { fetchAchievementsApi, claimAchievementApi } from "../api/achievementsApi";
import type { Achievement } from "./types";

interface AchievementsState {
  data: Achievement[] | null;
  loading: boolean;
  error: string | null;
  claimingCodes: Set<string>;
  fetchAchievements: () => Promise<void>;
  claimAchievement: (code: string) => Promise<void>;
}

export const useAchievementsStore = create<AchievementsState>()((set, get) => ({
  data: null,
  loading: false,
  error: null,
  claimingCodes: new Set(),

  fetchAchievements: async () => {
    set({ loading: true, error: null });
    const res = await fetchAchievementsApi();
    if (res.success && res.data) {
      set({ data: res.data, loading: false });
    } else {
      set({ error: res.error ?? "도전과제를 불러오지 못했습니다.", loading: false });
    }
  },

  claimAchievement: async (code: string) => {
    const { claimingCodes, data } = get();
    if (claimingCodes.has(code)) return; // 더블클릭 방지

    set({ claimingCodes: new Set([...claimingCodes, code]) });

    const res = await claimAchievementApi(code);

    if (res.success && res.data && data) {
      // 로컬 상태 업데이트: 해당 achievement의 reward_claimed_at 갱신
      const updated = data.map((a) =>
        a.code === code
          ? { ...a, reward_claimed_at: res.data!.reward_claimed_at, can_claim_reward: false }
          : a
      );
      set((state) => {
        const next = new Set(state.claimingCodes);
        next.delete(code);
        return { data: updated, claimingCodes: next };
      });
    } else {
      set((state) => {
        const next = new Set(state.claimingCodes);
        next.delete(code);
        return { claimingCodes: next };
      });
    }
  },
}));
