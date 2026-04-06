import { create } from "zustand";
import {
  analyzeUrlApi,
  createJdApi,
  saveDraftApi,
  type JdStatus,
  type JdUrlAnalysis,
} from "../api/jdApi";

type UrlValidState = "idle" | "checking" | "ok" | "error";

interface JdAddState {
  url: string;
  customTitle: string;
  status: JdStatus;
  interviewActive: boolean;

  urlValidState: UrlValidState;
  urlAnalysis: JdUrlAnalysis | null;

  isSubmitting: boolean;
  isSaving: boolean;
  error: string | null;

  setUrl: (url: string) => void;
  setCustomTitle: (title: string) => void;
  setStatus: (status: JdStatus) => void;
  setInterviewActive: (active: boolean) => void;
  clearError: () => void;
  submit: () => Promise<string | null>;
  saveDraft: () => Promise<boolean>;
  reset: () => void;
}

const INITIAL: Pick<
  JdAddState,
  "url" | "customTitle" | "status" | "interviewActive" | "urlValidState" | "urlAnalysis" | "isSubmitting" | "isSaving" | "error"
> = {
  url: "",
  customTitle: "",
  status: "planned",
  interviewActive: true,
  urlValidState: "idle",
  urlAnalysis: null,
  isSubmitting: false,
  isSaving: false,
  error: null,
};

let urlDebounce: ReturnType<typeof setTimeout> | null = null;

export const useJdAddStore = create<JdAddState>()((set, get) => ({
  ...INITIAL,

  setUrl: (url) => {
    set({ url, urlAnalysis: null, urlValidState: url.length > 10 ? "checking" : "idle" });

    if (urlDebounce) clearTimeout(urlDebounce);
    if (url.length <= 10) return;

    urlDebounce = setTimeout(async () => {
      const res = await analyzeUrlApi(url);
      if (res.success && res.data) {
        set({ urlValidState: "ok", urlAnalysis: res.data });
      } else {
        set({ urlValidState: "error", urlAnalysis: null });
      }
    }, 800);
  },

  setCustomTitle: (customTitle) => set({ customTitle }),
  setStatus: (status) => set({ status }),
  setInterviewActive: (interviewActive) => set({ interviewActive }),
  clearError: () => set({ error: null }),

  submit: async () => {
    const { url, customTitle, status, interviewActive } = get();
    if (!url) {
      set({ error: "URL을 입력해 주세요." });
      return null;
    }
    set({ isSubmitting: true, error: null });
    const res = await createJdApi({ url, customTitle, status, interviewActive });
    if (!res.success) {
      set({ isSubmitting: false, error: res.message });
      return null;
    }
    set({ isSubmitting: false });
    return res.jdId ?? null;
  },

  saveDraft: async () => {
    const { url, customTitle, status, interviewActive } = get();
    set({ isSaving: true, error: null });
    const res = await saveDraftApi({ url, customTitle, status, interviewActive });
    if (!res.success) {
      set({ isSaving: false, error: res.message });
      return false;
    }
    set({ isSaving: false });
    return true;
  },

  reset: () => set(INITIAL),
}));
