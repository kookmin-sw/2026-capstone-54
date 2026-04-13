import { create } from "zustand";
import {
  fetchResumesApi,
  deleteResumeApi,
} from "../api/resumeListApi";
import type { ResumeItem, ResumeSummary } from "../api/resumeListApi";

interface CtxMenu {
  open: boolean;
  resumeId: string | null;
  x: number;
  y: number;
}

interface ResumeListState {
  resumes: ResumeItem[];
  summary: ResumeSummary | null;
  loading: boolean;
  error: string | null;
  ctxMenu: CtxMenu;

  fetchResumes: () => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  openCtx: (id: string, x: number, y: number) => void;
  closeCtx: () => void;
}

const DEFAULT_CTX: CtxMenu = { open: false, resumeId: null, x: 0, y: 0 };

export const useResumeListStore = create<ResumeListState>()((set, get) => ({
  resumes: [],
  summary: null,
  loading: false,
  error: null,
  ctxMenu: DEFAULT_CTX,

  fetchResumes: async () => {
    set({ loading: true, error: null });
    try {
      const { resumes, summary } = await fetchResumesApi();
      set({ resumes, summary, loading: false });
    } catch {
      set({ loading: false, error: "이력서를 불러오지 못했습니다." });
    }
  },

  deleteResume: async (id) => {
    try {
      await deleteResumeApi(id);
      const resumes = get().resumes.filter((r) => r.id !== id);
      set((s) => ({
        resumes,
        summary: s.summary ? { ...s.summary, total: resumes.length } : s.summary,
        ctxMenu: DEFAULT_CTX,
      }));
    } catch {
      set({ ctxMenu: DEFAULT_CTX });
    }
  },

  openCtx: (resumeId, x, y) => set({ ctxMenu: { open: true, resumeId, x, y } }),
  closeCtx: () => set({ ctxMenu: DEFAULT_CTX }),
}));
