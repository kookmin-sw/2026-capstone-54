import { create } from "zustand";
import {
  fetchSettingsApi,
  updateProfileApi,
  changePasswordApi,
  updateNotificationsApi,
  updateConsentsApi,
  deleteInterviewDataApi,
  deleteAccountApi,
} from "../api/settingsApi";
import type { SettingsData, SettingsProfile, SettingsNotifications } from "../api/settingsApi";

export type SettingsPanel = "profile" | "password" | "notifications" | "subscription" | "consent";

interface SettingsState {
  data: SettingsData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveMessage: string | null;
  activePanel: SettingsPanel;
  consentBadge: boolean;

  /* Draft state for editing */
  profileDraft: Partial<SettingsProfile>;
  notificationsDraft: Partial<SettingsNotifications>;
  passwordDraft: { currentPassword: string; newPassword: string; confirmPassword: string };
  aiDataDraft: boolean | null;

  /* Actions */
  fetchSettings: () => Promise<void>;
  setActivePanel: (panel: SettingsPanel) => void;

  setProfileDraft: (field: keyof SettingsProfile, value: string) => void;
  saveProfile: () => Promise<void>;
  resetProfileDraft: () => void;

  setPasswordDraft: (field: "currentPassword" | "newPassword" | "confirmPassword", value: string) => void;
  savePassword: () => Promise<void>;
  resetPasswordDraft: () => void;

  toggleNotification: (key: keyof SettingsNotifications) => void;
  saveNotifications: () => Promise<void>;
  resetNotificationsDraft: () => void;

  setAiDataDraft: (value: boolean) => void;
  saveConsents: () => Promise<void>;

  deleteInterviewData: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  clearMessage: () => void;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  data: null,
  loading: false,
  saving: false,
  error: null,
  saveMessage: null,
  activePanel: "profile",
  consentBadge: true,

  profileDraft: {},
  notificationsDraft: {},
  passwordDraft: { currentPassword: "", newPassword: "", confirmPassword: "" },
  aiDataDraft: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    const res = await fetchSettingsApi();
    if (res.success && res.data) {
      set({
        data: res.data,
        loading: false,
        profileDraft: { ...res.data.profile },
        notificationsDraft: { ...res.data.notifications },
        aiDataDraft: res.data.consents.aiDataAgreed,
      });
    } else {
      set({ error: res.error ?? "설정을 불러오지 못했습니다.", loading: false });
    }
  },

  setActivePanel: (panel) => {
    set({ activePanel: panel, saveMessage: null, error: null });
    if (panel === "consent") set({ consentBadge: false });
  },

  setProfileDraft: (field, value) => {
    set((s) => {
      const newDraft = { ...s.profileDraft, [field]: value };
      // 직군 변경 시 직업도 초기화
      if (field === "jobCategory") {
        newDraft.jobTitle = "";
      }
      return { profileDraft: newDraft };
    });
  },

  saveProfile: async () => {
    set({ saving: true, error: null, saveMessage: null });
    const res = await updateProfileApi(get().profileDraft);
    if (res.success) {
      set((s) => ({
        saving: false,
        saveMessage: res.message,
        data: s.data
          ? { ...s.data, profile: { ...s.data.profile, ...s.profileDraft } as SettingsProfile }
          : s.data,
      }));
    } else {
      set({ saving: false, error: res.message });
    }
  },

  resetProfileDraft: () => {
    const data = get().data;
    if (data) set({ profileDraft: { ...data.profile }, saveMessage: null });
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

  toggleNotification: (key) => {
    set((s) => ({
      notificationsDraft: {
        ...s.notificationsDraft,
        [key]: !s.notificationsDraft[key],
      },
    }));
  },

  saveNotifications: async () => {
    const { notificationsDraft, data } = get();
    const merged: SettingsNotifications = { ...data!.notifications, ...notificationsDraft };
    set({ saving: true, error: null, saveMessage: null });
    const res = await updateNotificationsApi(merged);
    if (res.success) {
      set((s) => ({
        saving: false,
        saveMessage: res.message,
        data: s.data ? { ...s.data, notifications: merged } : s.data,
      }));
    } else {
      set({ saving: false, error: res.message });
    }
  },

  resetNotificationsDraft: () => {
    const data = get().data;
    if (data) set({ notificationsDraft: { ...data.notifications }, saveMessage: null });
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
        data: s.data
          ? { ...s.data, consents: { ...s.data.consents, aiDataAgreed } }
          : s.data,
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
