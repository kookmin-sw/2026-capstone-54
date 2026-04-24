import { apiRequest } from "@/shared/api/client";
import { profileApi } from "@/shared/api/profileApi";
import { getMeApi } from "@/features/auth/api/authApi";
import { getMyConsentsApi } from "@/features/auth/api/termsApi";
import type { JobCategory, Job } from "@/shared/api/profileApi";

export type { JobCategory, Job };

/* ── Types ── */
export interface SettingsProfile {
  name: string;
  email: string;
  avatarInitial: string;
  avatarUrl: string | null;
  jobCategoryId: number | null;
  jobCategory: JobCategory | null;
  jobIds: number[];
  jobs: Job[];
  careerStage: string;
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
  // my-consents API 원본 데이터
  myConsents: { termsDocumentId: number; title: string; version: string; agreedAt: string }[];
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

/* ── Fallback Mock (비프로필 영역 — 아직 API 미구현) ── */
const MOCK_NOTIFICATIONS: SettingsNotifications = {
  streakReminder: true,
  streakExpire: true,
  streakReward: true,
  reportReady: true,
  serviceNotice: false,
  marketing: false,
};

const MOCK_SUBSCRIPTION: SettingsSubscription = {
  plan: "free",
  resumeUsed: 1,
  resumeMax: 3,
  nextBillingDate: null,
};



/* ── Fetch Settings ──
   - 사용자 기본정보: GET /api/v1/users/me/
   - 프로필 (직군/직업): GET /api/v1/profiles/me/
   - 나머지는 미구현 → mock fallback
*/
export async function fetchSettingsApi(): Promise<{ success: boolean; data?: SettingsData; error?: string }> {
  try {
    const [me, userProfile, myConsents, avatar] = await Promise.allSettled([
      getMeApi(),
      profileApi.getMyProfile(),
      getMyConsentsApi(),
      profileApi.getAvatar(),
    ]);

    const meData = me.status === "fulfilled" ? me.value : null;
    const profileData = userProfile.status === "fulfilled" ? userProfile.value : null;
    const consentsData = myConsents.status === "fulfilled" ? myConsents.value : [];
    const avatarData = avatar.status === "fulfilled" ? avatar.value : null;

    const profile: SettingsProfile = {
      name: meData?.name ?? "",
      email: meData?.email ?? "",
      avatarInitial: meData?.name ? meData.name[0] : "?",
      avatarUrl: avatarData?.avatarUrl ?? null,
      jobCategoryId: profileData?.jobCategory?.id ?? null,
      jobCategory: profileData?.jobCategory ?? null,
      jobIds: profileData?.jobs?.map((j) => j.id) ?? [],
      jobs: profileData?.jobs ?? [],
      careerStage: profileData?.careerStage ?? "",
    };

    // my-consents에서 이용약관/개인정보처리방침 동의일 추출
    const formatDate = (iso: string) => {
      if (!iso) return "";
      const d = new Date(iso);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    };

    const termsConsent = consentsData.find((c) =>
      c.title?.includes("이용약관") || c.title?.toLowerCase().includes("terms")
    );
    const privacyConsent = consentsData.find((c) =>
      c.title?.includes("개인정보") || c.title?.toLowerCase().includes("privacy")
    );

    const consents: SettingsConsents = {
      termsAgreedAt: termsConsent ? formatDate(termsConsent.agreedAt) : "",
      privacyAgreedAt: privacyConsent ? formatDate(privacyConsent.agreedAt) : "",
      aiDataAgreed: false,
      myConsents: consentsData,
    };

    return {
      success: true,
      data: {
        profile,
        notifications: MOCK_NOTIFICATIONS,
        subscription: MOCK_SUBSCRIPTION,
        consents,
      },
    };
  } catch {
    return { success: false, error: "설정을 불러오지 못했습니다." };
  }
}

/* ── Upload Avatar ── */
export async function uploadAvatarApi(file: File): Promise<{ success: boolean; avatarUrl?: string; message: string }> {
  try {
    const res = await profileApi.uploadAvatar(file);
    return { success: true, avatarUrl: res.avatarUrl ?? undefined, message: "프로필 사진이 변경되었습니다." };
  } catch {
    return { success: false, message: "사진 업로드에 실패했습니다." };
  }
}

/* ── Update Profile ── POST /api/v1/profiles/me/ ── */
export async function updateProfileApi(payload: {
  jobCategoryId: number;
  jobIds: number[];
  careerStage?: string;
}): Promise<ApiResult> {
  try {
    await profileApi.saveMyProfile({ jobCategoryId: payload.jobCategoryId, jobIds: payload.jobIds, careerStage: payload.careerStage });
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
  try {
    await apiRequest("/api/v1/users/interview-data/", { method: "DELETE", auth: true });
    return { success: true, message: "면접 데이터가 삭제되었습니다." };
  } catch {
    return { success: false, message: "삭제에 실패했습니다." };
  }
}

/* ── Delete Account (unregister) ── */
export async function deleteAccountApi(): Promise<ApiResult> {
  try {
    await apiRequest("/api/v1/users/unregister/", { method: "DELETE", auth: true });
    return { success: true, message: "계정이 탈퇴 처리되었습니다." };
  } catch {
    return { success: false, message: "탈퇴 처리에 실패했습니다." };
  }
}
