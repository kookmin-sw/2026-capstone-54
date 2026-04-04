import { create } from "zustand";
import { fetchJdDetailApi, updateJdApi, deleteJdApi, type JdDetail } from "../api/jdDetailApi";
import type { JdStatus } from "../api/jdApi";

interface JdEditState {
  jd: JdDetail | null;
  customTitle: string;
  status: JdStatus;
  interviewActive: boolean;

  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  fetchJd: (id: string) => Promise<void>;
  setCustomTitle: (v: string) => void;
  setStatus: (v: JdStatus) => void;
  setInterviewActive: (v: boolean) => void;
  submit: () => Promise<boolean>;
  deleteJd: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useJdEditStore = create<JdEditState>()((set, get) => ({
  jd: null,
  customTitle: "",
  status: "planned",
  interviewActive: true,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchJd: async (id) => {
    set({ isLoading: true, error: null });
    const res = await fetchJdDetailApi(id);
    if (!res.success || !res.data) {
      set({ isLoading: false, error: res.message ?? "불러오기 실패" });
      return;
    }
    const jd = res.data;
    set({
      isLoading: false,
      jd,
      customTitle: jd.customTitle ?? "",
      status: jd.status,
      interviewActive: jd.interviewActive,
    });
  },

  setCustomTitle: (customTitle) => set({ customTitle }),
  setStatus: (status) => set({ status }),
  setInterviewActive: (interviewActive) => set({ interviewActive }),

  submit: async () => {
    const { jd, customTitle, status, interviewActive } = get();
    if (!jd) return false;
    set({ isSubmitting: true, error: null });
    const res = await updateJdApi(jd.id, { customTitle, status, interviewActive });
    if (!res.success) {
      set({ isSubmitting: false, error: res.message });
      return false;
    }
    set({ isSubmitting: false });
    return true;
  },

  deleteJd: async () => {
    const { jd } = get();
    if (!jd) return false;
    const res = await deleteJdApi(jd.id);
    if (!res.success) {
      set({ error: res.message });
      return false;
    }
    set({ jd: null });
    return true;
  },

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      jd: null,
      customTitle: "",
      status: "planned",
      interviewActive: true,
      isLoading: false,
      isSubmitting: false,
      error: null,
    }),
}));
