import { create } from "zustand";
import {
  fetchSettingsApi,
  uploadAvatarApi,
  updateProfileApi,
  changePasswordApi,
  updateNotificationsApi,
  updateConsentsApi,
  deleteInterviewDataApi,
  deleteAccountApi,
} from "../api/settingsApi";
import type { SettingsData, SettingsProfile, SettingsNotifications, JobCategory, Job } from "../api/settingsApi";
import { profileApi } from "@/shared/api/profileApi";
import { useAuthStore } from "@/features/auth";

export type SettingsPanel = "account" | "notifications" | "subscription" | "consent";

interface ProfileDraft {
  name: string;
  jobCategoryId: number | null;
  jobIds: number[];
  careerStage: string;
}

interface SettingsState {
  data: SettingsData | null;
  loading: boolean;
  saving: boolean;
  /* 동시 진행 중인 알림 토글 PUT 개수 (race condition 방지: 모든 요청 완료 시까지 saving 유지) */
  pendingNotificationRequests: number;
  error: string | null;
  saveMessage: string | null;
  activePanel: SettingsPanel;
  consentBadge: boolean;

  /* 직군/직업 목록 */
  jobCategories: JobCategory[];
  jobCategoriesLoading: boolean;
  availableJobs: Job[];
  availableJobsLoading: boolean;

  /* Draft state for editing */
  profileDraft: ProfileDraft;
  passwordDraft: { currentPassword: string; newPassword: string; confirmPassword: string };
  aiDataDraft: boolean | null;

  /* Actions */
  fetchSettings: () => Promise<void>;
  setActivePanel: (panel: SettingsPanel) => void;

  loadJobCategories: () => Promise<void>;
  loadJobsByCategory: (jobCategoryId: number) => Promise<void>;
  setProfileDraftField: <K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => void;
  toggleJobId: (jobId: number) => void;
  uploadAvatar: (file: File) => Promise<void>;
  saveProfile: () => Promise<void>;
  resetProfileDraft: () => void;

  setPasswordDraft: (field: "currentPassword" | "newPassword" | "confirmPassword", value: string) => void;
  savePassword: () => Promise<void>;
  resetPasswordDraft: () => void;

  toggleNotification: (key: keyof SettingsNotifications) => Promise<void>;

  setAiDataDraft: (value: boolean) => void;
  saveConsents: () => Promise<void>;

  deleteInterviewData: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  clearMessage: () => void;
}

const EMPTY_PROFILE_DRAFT: ProfileDraft = { name: "", jobCategoryId: null, jobIds: [], careerStage: "" };

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  data: null,
  loading: false,
  saving: false,
  pendingNotificationRequests: 0,
  error: null,
  saveMessage: null,
  activePanel: "account" as SettingsPanel,
  consentBadge: true,

  jobCategories: [],
  jobCategoriesLoading: false,
  availableJobs: [],
  availableJobsLoading: false,

  profileDraft: EMPTY_PROFILE_DRAFT,
  passwordDraft: { currentPassword: "", newPassword: "", confirmPassword: "" },
  aiDataDraft: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    const res = await fetchSettingsApi();
    if (res.success && res.data) {
      const profile = res.data.profile;
      set({
        data: res.data,
        loading: false,
        profileDraft: {
          name: profile.name,
          jobCategoryId: profile.jobCategoryId,
          jobIds: profile.jobIds,
          careerStage: profile.careerStage,
        },
        aiDataDraft: res.data.consents.aiDataAgreed,
      });
      // 프로필에 직군이 있으면 해당 직군의 직업 목록을 미리 로드
      if (profile.jobCategoryId) {
        get().loadJobsByCategory(profile.jobCategoryId);
      }
    } else {
      set({ error: res.error ?? "설정을 불러오지 못했습니다.", loading: false });
    }
  },

  setActivePanel: (panel) => {
    set({ activePanel: panel, saveMessage: null, error: null });
    if (panel === "consent") set({ consentBadge: false });
  },

  loadJobCategories: async () => {
    if (get().jobCategories.length > 0) return;
    set({ jobCategoriesLoading: true });
    try {
      const res = await profileApi.getJobCategories();
      set({ jobCategories: res.results, jobCategoriesLoading: false });
    } catch {
      set({ jobCategoriesLoading: false });
    }
  },

  loadJobsByCategory: async (jobCategoryId) => {
    set({ availableJobsLoading: true, availableJobs: [] });
    try {
      const res = await profileApi.getJobsByCategory(jobCategoryId);
      set({ availableJobs: res.results, availableJobsLoading: false });
    } catch {
      set({ availableJobsLoading: false });
    }
  },

  setProfileDraftField: (field, value) => {
    set((s) => {
      const next = { ...s.profileDraft, [field]: value } as ProfileDraft;
      if (field === "jobCategoryId") {
        next.jobIds = [];
      }
      return { profileDraft: next };
    });
    if (field === "jobCategoryId" && value !== null) {
      get().loadJobsByCategory(value as number);
    }
  },

  toggleJobId: (jobId) => {
    set((s) => {
      const ids = s.profileDraft.jobIds;
      if (ids.includes(jobId)) {
        return { profileDraft: { ...s.profileDraft, jobIds: ids.filter((id) => id !== jobId) } };
      }
      if (ids.length >= 3) return s;
      return { profileDraft: { ...s.profileDraft, jobIds: [...ids, jobId] } };
    });
  },

  uploadAvatar: async (file) => {
    set({ saving: true, error: null, saveMessage: null });
    const res = await uploadAvatarApi(file);
    if (res.success) {
      set((s) => ({
        saving: false,
        saveMessage: res.message,
        data: s.data ? {
          ...s.data,
          profile: { ...s.data.profile, avatarUrl: res.avatarUrl ?? null },
        } : s.data,
      }));
      // /users/me/는 avatarUrl을 반환하지 않으므로 직접 authStore user를 패치
      const authStore = useAuthStore.getState();
      if (authStore.user) {
        authStore.setUser({ ...authStore.user, avatarUrl: res.avatarUrl ?? null });
      }
    } else {
      set({ saving: false, error: res.message });
    }
  },

  saveProfile: async () => {
    const { profileDraft } = get();
    if (!profileDraft.jobCategoryId) {
      set({ error: "직군을 선택해주세요." });
      return;
    }
    set({ saving: true, error: null, saveMessage: null });
    const res = await updateProfileApi({
      jobCategoryId: profileDraft.jobCategoryId,
      jobIds: profileDraft.jobIds,
      careerStage: profileDraft.careerStage || undefined,
    });
    if (res.success) {
      // 로컬 data 업데이트
      set((s) => {
        if (!s.data) return { saving: false, saveMessage: res.message };
        const selectedCategory = s.jobCategories.find((c) => c.id === profileDraft.jobCategoryId) ?? null;
        const selectedJobs = s.availableJobs.filter((j) => profileDraft.jobIds.includes(j.id));
        return {
          saving: false,
          saveMessage: res.message,
          data: {
            ...s.data,
            profile: {
              ...s.data.profile,
              jobCategoryId: profileDraft.jobCategoryId,
              jobCategory: selectedCategory,
              jobIds: profileDraft.jobIds,
              jobs: selectedJobs,
              careerStage: profileDraft.careerStage,
            } as SettingsProfile,
          },
        };
      });
    } else {
      set({ saving: false, error: res.message });
    }
  },

  resetProfileDraft: () => {
    const data = get().data;
    if (data) {
      set({
        profileDraft: {
          name: data.profile.name,
          jobCategoryId: data.profile.jobCategoryId,
          jobIds: data.profile.jobIds,
          careerStage: data.profile.careerStage,
        },
        saveMessage: null,
      });
    }
  },

  setPasswordDraft: (field, value) => {
    set((s) => ({ passwordDraft: { ...s.passwordDraft, [field]: value } }));
  },

  savePassword: async () => {
    const { passwordDraft } = get();
    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
      set({ error: "새 비밀번호가 일치하지 않습니다." });
      return;
    }
    set({ saving: true, error: null, saveMessage: null });
    const res = await changePasswordApi({
      currentPassword: passwordDraft.currentPassword,
      newPassword: passwordDraft.newPassword,
    });
    if (res.success) {
      set({ saving: false, saveMessage: res.message, passwordDraft: { currentPassword: "", newPassword: "", confirmPassword: "" } });
    } else {
      set({ saving: false, error: res.message });
    }
  },

  resetPasswordDraft: () => {
    set({ passwordDraft: { currentPassword: "", newPassword: "", confirmPassword: "" }, saveMessage: null, error: null });
  },

  toggleNotification: async (key) => {
    const { data } = get();
    if (!data) return;

    const previousValue = data.notifications[key];
    const newValue = !previousValue;

    /* Optimistic update: 즉시 UI 반영 → 실패 시 rollback. 카운터로 동시 요청 추적. */
    set((s) => ({
      saving: true,
      pendingNotificationRequests: s.pendingNotificationRequests + 1,
      error: null,
      saveMessage: null,
      data: s.data ? {
        ...s.data,
        notifications: { ...s.data.notifications, [key]: newValue },
      } : s.data,
    }));

    const res = await updateNotificationsApi({ [key]: newValue });

    if (res.success) {
      set((s) => {
        const remaining = s.pendingNotificationRequests - 1;
        return {
          pendingNotificationRequests: remaining,
          saving: remaining > 0,
          saveMessage: res.message,
        };
      });
    } else {
      set((s) => {
        const remaining = s.pendingNotificationRequests - 1;
        return {
          pendingNotificationRequests: remaining,
          saving: remaining > 0,
          error: res.message,
          data: s.data ? {
            ...s.data,
            notifications: { ...s.data.notifications, [key]: previousValue },
          } : s.data,
        };
      });
    }
  },

  setAiDataDraft: (value) => set({ aiDataDraft: value }),

  saveConsents: async () => {
    const aiDataAgreed = get().aiDataDraft ?? false;
    set({ saving: true, error: null, saveMessage: null });
    const res = await updateConsentsApi({ aiDataAgreed });
    if (res.success) {
      set((s) => ({
        saving: false,
        saveMessage: res.message,
        data: s.data ? { ...s.data, consents: { ...s.data.consents, aiDataAgreed } } : s.data,
      }));
    } else {
      set({ saving: false, error: res.message });
    }
  },

  deleteInterviewData: async () => {
    set({ saving: true, error: null });
    const res = await deleteInterviewDataApi();
    set({ saving: false, saveMessage: res.success ? res.message : undefined, error: res.success ? null : res.message });
  },

  deleteAccount: async () => {
    set({ saving: true, error: null });
    const res = await deleteAccountApi();
    set({ saving: false, saveMessage: res.success ? res.message : undefined, error: res.success ? null : res.message });
  },

  clearMessage: () => set({ saveMessage: null, error: null }),
}));
