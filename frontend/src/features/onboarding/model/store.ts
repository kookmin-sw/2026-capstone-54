import { create } from "zustand";
import {
  fetchJobCategoriesApi,
  fetchJobsByCategoryApi,
  submitOnboardingProfileApi,
  type JobCategory,
  type Job,
} from "../api/onboardingApi";

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
  jobCategories: JobCategory[];
  jobCategoriesLoading: boolean;

  selectedJobCategoryId: number | null;
  availableJobs: Job[];
  availableJobsLoading: boolean;
  selectedJobIds: number[];

  jobStatus: string;
  isLoading: boolean;
  error: string | null;

  loadJobCategories: () => Promise<void>;
  selectJobCategory: (jobCategoryId: number) => Promise<void>;
  toggleJobId: (jobId: number) => void;
  setJobStatus: (status: string) => void;
  submitProfile: () => Promise<boolean>;
  clearError: () => void;
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  jobCategories: [],
  jobCategoriesLoading: false,

  selectedJobCategoryId: null,
  availableJobs: [],
  availableJobsLoading: false,
  selectedJobIds: [],

  jobStatus: "",
  isLoading: false,
  error: null,

  loadJobCategories: async () => {
    if (get().jobCategories.length > 0) return;
    set({ jobCategoriesLoading: true });
    try {
      const categories = await fetchJobCategoriesApi();
      set({ jobCategories: categories, jobCategoriesLoading: false });
    } catch {
      set({ jobCategoriesLoading: false });
    }
  },

  selectJobCategory: async (jobCategoryId: number) => {
    if (get().selectedJobCategoryId === jobCategoryId) return;
    set({
      selectedJobCategoryId: jobCategoryId,
      selectedJobIds: [],
      availableJobs: [],
      availableJobsLoading: true,
    });
    try {
      const jobs = await fetchJobsByCategoryApi(jobCategoryId);
      if (get().selectedJobCategoryId === jobCategoryId) {
        set({ availableJobs: jobs, availableJobsLoading: false });
      }
    } catch {
      set({ availableJobsLoading: false });
    }
  },

  toggleJobId: (jobId: number) =>
    set((state) => {
      if (state.selectedJobIds.includes(jobId)) {
        return { selectedJobIds: state.selectedJobIds.filter((id) => id !== jobId) };
      }
      if (state.selectedJobIds.length >= 3) return state;
      return { selectedJobIds: [...state.selectedJobIds, jobId] };
    }),

  setJobStatus: (status) => set({ jobStatus: status }),

  submitProfile: async () => {
    const { selectedJobCategoryId, selectedJobIds, jobStatus } = get();
    if (!selectedJobCategoryId) {
      set({ error: "희망 직군을 선택해주세요." });
      return false;
    }
    if (selectedJobIds.length === 0) {
      set({ error: "희망 직업을 1개 이상 선택해주세요." });
      return false;
    }
    set({ isLoading: true, error: null });
    const res = await submitOnboardingProfileApi({
      jobCategoryId: selectedJobCategoryId,
      jobIds: selectedJobIds,
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
