import { create } from "zustand";
import { fetchAchievementsApi, claimAchievementApi } from "../api/achievementsApi";
import type { Achievement } from "./types";

interface AchievementsState {
  data: Achievement[] | null;
  loading: boolean;
  error: string | null;
  claimError: string | null;
  claimingCodes: Set<string>;
  fetchAchievements: () => Promise<void>;
  claimAchievement: (code: string) => Promise<void>;
}

export const useAchievementsStore = create<AchievementsState>()((set, get) => ({
  data: null,
  loading: false,
  error: null,
  claimError: null,
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
    if (get().claimingCodes.has(code)) return; // 더블클릭 방지

    set((state) => ({
      claimingCodes: new Set(state.claimingCodes).add(code),
      claimError: null,
    }));

    const res = await claimAchievementApi(code);

    set((state) => {
      const nextClaiming = new Set(state.claimingCodes);
      nextClaiming.delete(code);

        if (res.success && res.data && state.data) {
          // 로컬 상태 업데이트: 해당 achievement의 rewardClaimedAt 갱신
          const updatedData = state.data.map((a) =>
            a.code === code
              ? { ...a, rewardClaimedAt: res.data!.rewardClaimedAt, canClaimReward: false }
              : a
          );
        return { data: updatedData, claimingCodes: nextClaiming };
      }

      return {
        claimingCodes: nextClaiming,
        claimError: res.error ?? "보상 수령에 실패했습니다.",
      };
    });
  },
}));
