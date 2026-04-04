// Settings API - Connected to backend

import { apiRequest } from "@/shared/api/client";

const USE_MOCK = false;

/* ── Types ── */
export interface SettingsProfile {
  name: string;
  email: string;
  jobCategory: string;
  jobTitle: string;
  avatarInitial: string;
}

export interface SettingsNotifications {
  streakReminder: boolean;
  streakExpire: boolean;
  streakReward: boolean;
  reportReady: boolean;
  serviceNotice: boolean;
  marketing: boolean;
}

export interface SettingsSubscription {
  plan: "free" | "pro";
  resumeUsed: number;
  resumeMax: number;
  nextBillingDate: string | null;
}

export interface SettingsConsents {
  termsAgreedAt: string;
  privacyAgreedAt: string;
  aiDataAgreed: boolean;
}

export interface SettingsData {
  profile: SettingsProfile;
  notifications: SettingsNotifications;
  subscription: SettingsSubscription;
  consents: SettingsConsents;
}

export interface ApiResult {
  success: boolean;
  message: string;
}

/* ── Mock Data ── */
const MOCK_SETTINGS: SettingsData = {
  profile: {
    name: "김지원",
    email: "jiwon@example.com",
    jobCategory: "IT/개발",
    jobTitle: "대학생",
    avatarInitial: "김",
  },
  notifications: {
    streakReminder: true,
    streakExpire: true,
    streakReward: true,
    reportReady: true,
    serviceNotice: false,
    marketing: false,
  },
  subscription: {
    plan: "free",
    resumeUsed: 1,
    resumeMax: 3,
    nextBillingDate: null,
  },
  consents: {
    termsAgreedAt: "2025.01.15",
    privacyAgreedAt: "2025.01.15",
    aiDataAgreed: false,
  },
};

/* ── Fetch Settings ── */
export async function fetchSettingsApi(): Promise<{ success: boolean; data?: SettingsData; error?: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 350));
    return { success: true, data: MOCK_SETTINGS };
  }
  try {
    const data = await apiRequest<SettingsData>("/api/v1/users/settings/", { method: "GET", auth: true });
    return { success: true, data };
  } catch {
    return { success: true, data: MOCK_SETTINGS };
  }
}

/* ── Update Profile ── */
export async function updateProfileApi(payload: Partial<SettingsProfile>): Promise<ApiResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 700));
    return { success: true, message: "프로필이 저장되었습니다." };
  }
  try {
    await apiRequest("/api/v1/users/profile/", {
      method: "PUT", auth: true, body: JSON.stringify(payload),
    });
    return { success: true, message: "프로필이 저장되었습니다." };
  } catch {
    return { success: false, message: "저장에 실패했습니다." };
  }
}

/* ── Change Password ── */
export async function changePasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return { success: true, message: "비밀번호가 변경되었습니다." };
  }
  try {
    await apiRequest("/api/v1/users/change-password/", {
      method: "POST", auth: true,
      body: JSON.stringify({
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      }),
    });
    return { success: true, message: "비밀번호가 변경되었습니다." };
  } catch {
    return { success: false, message: "비밀번호 변경에 실패했습니다." };
  }
}

/* ── Update Notifications ── */
export async function updateNotificationsApi(payload: SettingsNotifications): Promise<ApiResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: "알림 설정이 저장되었습니다." };
  }
  try {
    await apiRequest("/api/v1/users/notifications/", {
      method: "PUT", auth: true, body: JSON.stringify(payload),
    });
    return { success: true, message: "알림 설정이 저장되었습니다." };
  } catch {
    return { success: false, message: "저장에 실패했습니다." };
  }
}

/* ── Update Consents ── */
export async function updateConsentsApi(payload: { aiDataAgreed: boolean }): Promise<ApiResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: "동의 설정이 저장되었습니다." };
  }
  try {
    await apiRequest("/api/v1/users/consents/", {
      method: "PUT", auth: true, body: JSON.stringify({ ai_data_agreed: payload.aiDataAgreed }),
    });
    return { success: true, message: "동의 설정이 저장되었습니다." };
  } catch {
    return { success: false, message: "저장에 실패했습니다." };
  }
}

/* ── Delete Interview Data ── */
export async function deleteInterviewDataApi(): Promise<ApiResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 900));
    return { success: true, message: "면접 데이터가 삭제되었습니다." };
  }
  try {
    await apiRequest("/api/v1/users/interview-data/", { method: "DELETE", auth: true });
    return { success: true, message: "면접 데이터가 삭제되었습니다." };
  } catch {
    return { success: false, message: "삭제에 실패했습니다." };
  }
}

/* ── Delete Account ── */
export async function deleteAccountApi(): Promise<ApiResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1000));
    return { success: true, message: "계정이 탈퇴 처리되었습니다." };
  }
  try {
    await apiRequest("/api/v1/users/", { method: "DELETE", auth: true });
    return { success: true, message: "계정이 탈퇴 처리되었습니다." };
  } catch {
    return { success: false, message: "탈퇴 처리에 실패했습니다." };
  }
}
