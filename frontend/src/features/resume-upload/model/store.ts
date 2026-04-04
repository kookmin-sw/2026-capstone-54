import { create } from "zustand";
import { uploadResumeApi } from "../api/resumeUploadApi";

interface ResumeUploadState {
  title: string;
  file: File | null;
  isDragging: boolean;
  uploading: boolean;
  uploadPct: number;
  showSuccess: boolean;
  error: string | null;

  setTitle: (v: string) => void;
  setFile: (f: File) => void;
  removeFile: () => void;
  setDragging: (v: boolean) => void;
  upload: () => Promise<void>;
  closeSuccess: () => void;
  clearError: () => void;
}

export const useResumeUploadStore = create<ResumeUploadState>()((set, get) => ({
  title: "",
  file: null,
  isDragging: false,
  uploading: false,
  uploadPct: 0,
  showSuccess: false,
  error: null,

  setTitle: (title) => set({ title, error: null }),
  setFile: (file) => set({ file, error: null }),
  removeFile: () => set({ file: null }),
  setDragging: (isDragging) => set({ isDragging }),

  upload: async () => {
    const { title, file } = get();
    if (!file) return;
    if (!title.trim()) {
      set({ error: "title" });
      return;
    }
    set({ uploading: true, uploadPct: 0, error: null });
    const res = await uploadResumeApi(
      { title, fileName: file.name, fileSize: file.size },
      (pct) => set({ uploadPct: pct })
    );
    if (!res.success) {
      set({ uploading: false, error: res.message });
      return;
    }
    set({ uploading: false, showSuccess: true });
  },

  closeSuccess: () => set({ showSuccess: false }),
  clearError: () => set({ error: null }),
}));
