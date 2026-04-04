import { create } from "zustand";
import { fetchHomeDataApi } from "../api/homeApi";
import type { HomeData } from "../api/homeApi";

interface HomeState {
  data: HomeData | null;
  loading: boolean;
  error: string | null;
  fetchHome: () => Promise<void>;
}

export const useHomeStore = create<HomeState>()((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchHome: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetchHomeDataApi();
      if (res.success && res.data) {
        set({ data: res.data, loading: false });
      } else {
        set({ error: res.error || "데이터를 불러오지 못했습니다.", loading: false });
      }
    } catch (err) {
      console.error("Home fetch error:", err);
      set({ error: "네트워크 오류가 발생했습니다.", loading: false });
    }
  },
}));
