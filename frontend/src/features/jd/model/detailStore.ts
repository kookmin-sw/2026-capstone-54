import { create } from "zustand";
import { fetchJdDetailApi, updateJdStatusApi, deleteJdApi, type JdDetail } from "../api/jdDetailApi";
import type { JdStatus } from "../api/jdApi";

interface JdDetailState {
  jd: JdDetail | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  fetchJd: (id: string) => Promise<void>;
  updateStatus: (status: JdStatus) => Promise<void>;
  deleteJd: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useJdDetailStore = create<JdDetailState>()((set, get) => ({
  jd: null,
  isLoading: false,
  isUpdating: false,
  error: null,

  fetchJd: async (id) => {
    set({ isLoading: true, error: null });
    const res = await fetchJdDetailApi(id);
    if (!res.success || !res.data) {
      set({ isLoading: false, error: res.message ?? "불러오기 실패" });
      return;
    }
    set({ isLoading: false, jd: res.data });
  },

  updateStatus: async (status) => {
    const { jd } = get();
    if (!jd) return;
    set({ isUpdating: true });
    const res = await updateJdStatusApi(jd.id, status);
    if (res.success) {
      set({ jd: { ...jd, status }, isUpdating: false });
    } else {
      set({ isUpdating: false, error: res.message });
    }
  },

  deleteJd: async () => {
    const { jd } = get();
    if (!jd) return false;
    const res = await deleteJdApi(jd.id);
    if (res.success) {
      set({ jd: null });
      return true;
    }
    set({ error: res.message });
    return false;
  },

  clearError: () => set({ error: null }),
  reset: () => set({ jd: null, isLoading: false, isUpdating: false, error: null }),
}));
