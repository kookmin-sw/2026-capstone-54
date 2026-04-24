import { create } from "zustand";
import { fetchAchievementsApi, claimAchievementApi } from "../api/achievementsApi";
import type { Achievement } from "./types";
import { useTicketStore } from "@/shared/store/ticketStore";

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
    if (get().claimingCodes.has(code)) return;

    set((state) => ({
      claimingCodes: new Set(state.claimingCodes).add(code),
      claimError: null,
    }));

    const res = await claimAchievementApi(code);

    if (res.success && res.data && get().data) {
      const updatedData = get().data!.map((a) =>
        a.code === code
          ? { ...a, rewardClaimedAt: res.data!.rewardClaimedAt, canClaimReward: false }
          : a
      );
      set({ data: updatedData, claimingCodes: new Set(get().claimingCodes) });
      useTicketStore.getState().refetch();
    } else {
      const nextClaiming = new Set(get().claimingCodes);
      nextClaiming.delete(code);
      set({ claimingCodes: nextClaiming, claimError: res.error ?? "보상 수령에 실패했습니다." });
    }
  },
}));
