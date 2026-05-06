import { create } from "zustand";
import { fetchAchievementsApi, claimAchievementApi } from "../api/achievementsApi";
import type { Achievement, FilterState } from "./types";
import { useTicketStore } from "@/shared/store/ticketStore";

const DEFAULT_LIMIT = 20;

const DEFAULT_FILTERS: FilterState = {
  category: null,
  status: null,
  rewardClaim: null,
};

interface AchievementsState {
  /** 현재 로드된 업적 목록 (누적) */
  data: Achievement[] | null;
  /** 전체 업적 수 */
  total: number;
  /** 현재 오프셋 */
  offset: number;
  /** 페이지 크기 */
  limit: number;
  /** 더 불러올 데이터가 있는지 */
  hasMore: boolean;
  /** 로딩 상태 */
  loading: boolean;
  /** 추가 로딩 상태 (무한 스크롤) */
  loadingMore: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 보상 수령 에러 */
  claimError: string | null;
  /** 보상 수령 중인 코드 */
  claimingCodes: Set<string>;
  /** 필터 상태 */
  filters: FilterState;

  fetchAchievements: () => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  claimAchievement: (code: string) => Promise<void>;
}

export const useAchievementsStore = create<AchievementsState>()((set, get) => ({
  data: null,
  total: 0,
  offset: 0,
  limit: DEFAULT_LIMIT,
  hasMore: true,
  loading: false,
  loadingMore: false,
  error: null,
  claimError: null,
  claimingCodes: new Set(),
  filters: { ...DEFAULT_FILTERS },

  fetchAchievements: async () => {
    if (get().loading) return;
    const { filters, limit } = get();
    set({ data: null, loading: true, error: null, offset: 0, hasMore: true });
    const res = await fetchAchievementsApi(filters, limit, 0);
    if (res.success && res.data) {
      const hasMore = res.data.results.length < res.data.total;
      set({
        data: res.data.results,
        total: res.data.total,
        offset: res.data.results.length,
        hasMore,
        loading: false,
      });
    } else {
      set({ error: res.error ?? "도전과제를 불러오지 못했습니다.", loading: false });
    }
  },

  loadMore: async () => {
    const { filters, limit, offset, hasMore, loadingMore, loading } = get();
    if (!hasMore || loadingMore || loading) return;

    set({ loadingMore: true });
    const res = await fetchAchievementsApi(filters, limit, offset);
    if (res.success && res.data) {
      const currentData = get().data ?? [];
      const newData = [...currentData, ...res.data.results];
      const hasMoreData = newData.length < res.data.total;
      set({
        data: newData,
        total: res.data.total,
        offset: newData.length,
        hasMore: hasMoreData,
        loadingMore: false,
      });
    } else {
      set({ loadingMore: false, error: res.error ?? "추가 데이터를 불러오지 못했습니다." });
    }
  },

  setFilters: (newFilters: Partial<FilterState>) => {
    const { filters } = get();
    set({ filters: { ...filters, ...newFilters } });
    // 필터 변경 시 자동으로 다시 조회
    get().fetchAchievements();
  },

  clearFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
    get().fetchAchievements();
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
      const nextClaiming = new Set(get().claimingCodes);
      nextClaiming.delete(code);
      set({ data: updatedData, claimingCodes: nextClaiming });
      useTicketStore.getState().refetch();
    } else {
      const nextClaiming = new Set(get().claimingCodes);
      nextClaiming.delete(code);
      set({ claimingCodes: nextClaiming, claimError: res.error ?? "보상 수령에 실패했습니다." });
    }
  },
}));
