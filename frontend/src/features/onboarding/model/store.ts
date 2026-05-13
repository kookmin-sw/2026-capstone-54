import { create } from "zustand";
import { isApiError } from "@/shared/api/client";
import {
  fetchJobCategoriesApi,
  fetchJobsByCategoryApi,
  submitOnboardingProfileApi,
  type JobCategory,
  type Job,
} from "../api/onboardingApi";

export const JOB_STATUS_OPTIONS = [
  { value: "", label: "선택해 주세요" },
  { value: "university_student", label: "대학생" },
  { value: "graduate_student", label: "대학원생" },
  { value: "lt_1_year", label: "1년 미만" },
  { value: "1_3_years", label: "1-3년" },
  { value: "3_7_years", label: "3-7년" },
  { value: "over_7_years", label: "7년 이상" },
  { value: "other", label: "기타" },
] as const;

interface OnboardingState {
  jobCategories: JobCategory[];
  jobCategoriesLoading: boolean;

  selectedJobCategoryId: number | null;
  availableJobs: Job[];
  availableJobsLoading: boolean;
  selectedJobIds: number[];

  careerStage: string;
  isLoading: boolean;
  error: string | null;

  loadJobCategories: () => Promise<void>;
  selectJobCategory: (jobCategoryId: number) => Promise<void>;
  toggleJobId: (jobId: number) => void;
  setCareerStage: (status: string) => void;
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

  careerStage: "",
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

  setCareerStage: (status) => set({ careerStage: status }),

  submitProfile: async () => {
    const { selectedJobCategoryId, selectedJobIds, careerStage } = get();
    if (!selectedJobCategoryId) {
      set({ error: "희망 직군을 선택해주세요." });
      return false;
    }
    if (selectedJobIds.length === 0) {
      set({ error: "희망 직업을 1개 이상 선택해주세요." });
      return false;
    }
    if (!careerStage) {
      set({ error: "현재 직업 상태를 선택해주세요." });
      return false;
    }
    set({ isLoading: true, error: null });
    try {
      await submitOnboardingProfileApi({
        jobCategoryId: selectedJobCategoryId,
        jobIds: selectedJobIds,
        careerStage,
      });
      set({ isLoading: false });
      return true;
    } catch (e) {
      const message = isApiError(e) && e.message ? e.message : "프로필 저장에 실패했습니다.";
      set({ isLoading: false, error: message });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
