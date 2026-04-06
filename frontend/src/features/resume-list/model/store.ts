import { create } from "zustand";
import {
  fetchResumesApi,
  toggleResumeActiveApi,
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
  ctxMenu: CtxMenu;

  fetchResumes: () => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  openCtx: (id: string, x: number, y: number) => void;
  closeCtx: () => void;
}

const DEFAULT_CTX: CtxMenu = { open: false, resumeId: null, x: 0, y: 0 };

export const useResumeListStore = create<ResumeListState>()((set, get) => ({
  resumes: [],
  summary: null,
  loading: false,
  ctxMenu: DEFAULT_CTX,

  fetchResumes: async () => {
    set({ loading: true });
    const { resumes, summary } = await fetchResumesApi();
    set({ resumes, summary, loading: false });
  },

  toggleActive: async (id) => {
    await toggleResumeActiveApi(id);
    const updated = get().resumes.map((r) => {
      if (r.id !== id) return r;
      const next = r.status === "active" ? "inactive" : "active";
      return { ...r, status: next as ResumeItem["status"] };
    });
    const active = updated.filter((r) => r.status === "active").length;
    const inactive = updated.filter((r) => r.status === "inactive").length;
    set((s) => ({
      resumes: updated,
      summary: s.summary ? { ...s.summary, active, inactive } : s.summary,
      ctxMenu: DEFAULT_CTX,
    }));
  },

  deleteResume: async (id) => {
    await deleteResumeApi(id);
    const resumes = get().resumes.filter((r) => r.id !== id);
    set((s) => ({
      resumes,
      summary: s.summary ? { ...s.summary, total: resumes.length } : s.summary,
      ctxMenu: DEFAULT_CTX,
    }));
  },

  openCtx: (resumeId, x, y) => set({ ctxMenu: { open: true, resumeId, x, y } }),
  closeCtx: () => set({ ctxMenu: DEFAULT_CTX }),
}));
