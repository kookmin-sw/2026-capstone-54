import { create } from "zustand";
import { fetchStreakApi } from "../api/streakApi";
import type { StreakData } from "../api/streakApi";

interface StreakState {
  data: StreakData | null;
  loading: boolean;
  error: string | null;
  fetchStreak: () => Promise<void>;
}

export const useStreakStore = create<StreakState>()((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchStreak: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetchStreakApi();
      if (res.success && res.data) {
        set({ data: res.data, loading: false });
      } else {
        set({ error: res.error ?? "스트릭 정보를 불러오지 못했습니다.", loading: false });
      }
    } catch (err) {
      console.error("Streak fetch error:", err);
      set({ error: "네트워크 오류가 발생했습니다.", loading: false });
    }
  },
}));
