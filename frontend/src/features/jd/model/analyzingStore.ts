import { create } from "zustand";
import { runAnalysisApi, type AnalysisStep } from "../api/jdAnalyzingApi";

interface JdAnalyzingState {
  steps: AnalysisStep[];
  progress: number;
  isRunning: boolean;
  isComplete: boolean;

  startAnalysis: (onComplete: () => void) => void;
  reset: () => void;
}

const INITIAL_STEPS: AnalysisStep[] = [
  { key: "url",       label: "URL 확인",   status: "pending" },
  { key: "fetch",     label: "페이지 수집", status: "pending" },
  { key: "parse",     label: "텍스트 파싱", status: "pending" },
  { key: "embed",     label: "임베딩 저장", status: "pending" },
  { key: "questions", label: "질문 준비",   status: "pending" },
];

export const useJdAnalyzingStore = create<JdAnalyzingState>()((set, get) => ({
  steps: INITIAL_STEPS,
  progress: 0,
  isRunning: false,
  isComplete: false,

  startAnalysis: (onComplete) => {
    if (get().isRunning) return;
    set({ isRunning: true, isComplete: false, steps: INITIAL_STEPS, progress: 0 });

    runAnalysisApi(
      (steps, progress) => set({ steps, progress }),
      () => {
        set({ isRunning: false, isComplete: true });
        onComplete();
      }
    );
  },

  reset: () =>
    set({ steps: INITIAL_STEPS, progress: 0, isRunning: false, isComplete: false }),
}));
