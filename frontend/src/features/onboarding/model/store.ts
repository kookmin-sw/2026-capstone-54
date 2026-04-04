import { create } from "zustand";
import {
  submitProfileApi,
  fetchJobTitlesApi,
  type JobTitleOption,
} from "../api/onboardingApi";

export const JOB_CATEGORIES = [
  { id: "it", label: "IT/개발", emoji: "💻" },
  { id: "marketing", label: "마케팅", emoji: "📣" },
  { id: "finance", label: "금융/회계", emoji: "🏦" },
  { id: "sales", label: "영업/서비스", emoji: "👋" },
  { id: "hr", label: "인사/HR", emoji: "🏢" },
] as const;

export const JOB_STATUS_OPTIONS = [
  { value: "", label: "선택해 주세요" },
  { value: "student", label: "대학생/대학원생" },
  { value: "job-seeker", label: "취업 준비생" },
  { value: "new-grad", label: "신입 (1년 미만)" },
  { value: "junior", label: "주니어 (1~3년)" },
  { value: "mid", label: "미드레벨 (3~7년)" },
  { value: "senior", label: "시니어 (7년 이상)" },
  { value: "career-change", label: "이직 준비 중" },
] as const;

interface OnboardingState {
  selectedJob: string;
  jobTitles: string[];
  jobTitleOptions: JobTitleOption[];
  jobTitlesLoading: boolean;
  jobStatus: string;
  isLoading: boolean;
  error: string | null;

  selectJob: (jobId: string) => void;
  toggleJobTitle: (title: string) => void;
  setJobStatus: (status: string) => void;
  submitProfile: () => Promise<boolean>;
  clearError: () => void;
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  selectedJob: "",
  jobTitles: [],
  jobTitleOptions: [],
  jobTitlesLoading: false,
  jobStatus: "",
  isLoading: false,
  error: null,

  selectJob: async (jobId: string) => {
    const current = get().selectedJob;
    if (current === jobId) return;

    set({
      selectedJob: jobId,
      jobTitles: [],
      jobTitleOptions: [],
      jobTitlesLoading: true,
    });

    const options = await fetchJobTitlesApi(jobId);
    // 비동기 완료 후 여전히 같은 직군이 선택되어 있는지 확인
    if (get().selectedJob === jobId) {
      set({ jobTitleOptions: options, jobTitlesLoading: false });
    }
  },

  toggleJobTitle: (title: string) =>
    set((state) => {
      if (state.jobTitles.includes(title)) {
        return { jobTitles: state.jobTitles.filter((t) => t !== title) };
      }
      if (state.jobTitles.length >= 3) return state;
      return { jobTitles: [...state.jobTitles, title] };
    }),

  setJobStatus: (status) => set({ jobStatus: status }),

  submitProfile: async () => {
    const { selectedJob, jobTitles, jobStatus } = get();
    set({ isLoading: true, error: null });
    const res = await submitProfileApi({
      desiredJob: selectedJob,
      jobTitles,
      jobStatus,
    });
    if (!res.success) {
      set({ isLoading: false, error: res.message });
      return false;
    }
    set({ isLoading: false });
    return true;
  },

  clearError: () => set({ error: null }),
}));
