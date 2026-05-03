import { create } from "zustand";
import {
  signUpApi,
  loginApi,
  signOutApi,
  verifyEmailApi,
  resendVerifyEmailApi,
  getMeApi,
} from "../api/authApi";
import type { UserMe } from "../api/authApi";
import {
  getAccessToken,
  refreshAccessToken,
} from "@/shared/api/client";
import { profileApi } from "@/shared/api/profileApi";

function fetchAndSetAvatar(set: (partial: object) => void) {
  profileApi.getAvatar().then((avatar) => {
    if (avatar?.avatarUrl) {
      set((s: { user: UserMe | null }) => s.user ? { user: { ...s.user, avatarUrl: avatar.avatarUrl } } : {});
    }
  }).catch(() => {});
}

interface LoginResult {
  success: boolean;
  isEmailConfirmed?: boolean;
  isProfileCompleted?: boolean;
}

interface AuthState {
  user: UserMe | null;
  authReady: boolean; // initAuth 완료 여부
  isLoading: boolean;
  isVerifying: boolean;
  isResending: boolean;
  error: string | null;
  pendingEmail: string | null;

  signUp: (payload: { name: string; email: string; password: string; termsDocumentIds?: number[] }) => Promise<boolean>;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  fetchMe: () => Promise<void>;
  /** 앱 초기화 시 localStorage 토큰이 있으면 사용자 정보를 복원한다. */
  initAuth: () => Promise<void>;
  setPendingEmail: (email: string) => void;
  clearError: () => void;
  setUser: (user: UserMe | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  authReady: false,
  isLoading: false,
  isVerifying: false,
  isResending: false,
  error: null,
  pendingEmail: null,

  signUp: async ({ name, email, password, termsDocumentIds }) => {
    set({ isLoading: true, error: null });
    const res = await signUpApi({ name, email, password, termsDocumentIds });
    if (!res.success) {
      set({ isLoading: false, error: res.message });
      return false;
    }
    // 회원가입 후 토큰이 설정되었으므로 사용자 정보 조회
    const me = await getMeApi();
    if (!me) {
      set({ isLoading: false, error: "사용자 정보를 불러오는데 실패했습니다." });
      return false;
    }
    set({ isLoading: false, pendingEmail: email, user: me });
    return true;
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const res = await loginApi({ email, password });
    if (!res.success) {
      set({ isLoading: false, error: res.message });
      return { success: false };
    }
    // 로그인 성공 시 사용자 정보 즉시 조회 (isProfileCompleted, isEmailConfirmed 확인)
    const me = await getMeApi();
    set({ isLoading: false, pendingEmail: email, user: me });
    if (me) fetchAndSetAvatar(set);
    return {
      success: true,
      isEmailConfirmed: me?.isEmailConfirmed ?? res.isEmailConfirmed,
      isProfileCompleted: me?.isProfileCompleted ?? false,
    };
  },

  logout: async () => {
    set({ isLoading: true });
    await signOutApi();
    set({ user: null, authReady: true, isLoading: false, pendingEmail: null, error: null });
  },

  verifyCode: async (code) => {
    set({ isVerifying: true, error: null });
    const res = await verifyEmailApi(code);
    if (!res.success) {
      set({ isVerifying: false, error: res.message });
      return false;
    }
    // 인증된 사용자 - 최신 사용자 정보 업데이트
    const me = await getMeApi();
    if (!me) {
      set({ isVerifying: false, error: "사용자 정보를 불러오는데 실패했습니다." });
      return false;
    }
    set({ isVerifying: false, user: me });
    return true;
  },

  resendVerification: async () => {
    set({ isResending: true, error: null });
    const res = await resendVerifyEmailApi();
    if (!res.success) {
      set({ isResending: false, error: res.message });
      return false;
    }
    set({ isResending: false });
    return true;
  },

  fetchMe: async () => {
    const me = await getMeApi();
    if (me) set({ user: me });
  },

  initAuth: async () => {
    // 메모리 access token이 없으면 refresh(cookie) 기반 갱신부터 시도
    if (!getAccessToken()) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        set({ authReady: true });
        return;
      }
    }

    if (!getAccessToken()) {
      set({ authReady: true });
      return;
    }

    const me = await getMeApi({ noRetry: true });
    set({ user: me ?? null, authReady: true });
    if (me) fetchAndSetAvatar(set);
  },

  setPendingEmail: (email) => set({ pendingEmail: email }),
  clearError: () => set({ error: null }),
  setUser: (user) => set({ user }),
}));
