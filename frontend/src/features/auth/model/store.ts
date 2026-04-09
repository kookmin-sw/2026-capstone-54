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
import { getAccessToken, getRefreshToken, refreshAccessToken } from "@/shared/api/client";

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

  signUp: (payload: { name: string; email: string; password: string }) => Promise<boolean>;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  fetchMe: () => Promise<void>;
  /** 앱 초기화 시 localStorage 토큰이 있으면 사용자 정보를 복원한다. */
  initAuth: () => Promise<void>;
  setPendingEmail: (email: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  authReady: false,
  isLoading: false,
  isVerifying: false,
  isResending: false,
  error: null,
  pendingEmail: null,

  signUp: async ({ name, email, password }) => {
    set({ isLoading: true, error: null });
    const res = await signUpApi({ name, email, password });
    if (!res.success) {
      set({ isLoading: false, error: res.message });
      return false;
    }
    set({ isLoading: false, pendingEmail: email });
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
    set({ isVerifying: false });
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
    // access token도 없고 refresh token도 없으면 로그인 상태 아님
    if (!getAccessToken() && !getRefreshToken()) {
      set({ authReady: true });
      return;
    }

    // access token이 없지만 refresh token이 있으면 먼저 갱신 시도
    if (!getAccessToken() && getRefreshToken()) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        set({ authReady: true });
        return;
      }
    }

    const me = await getMeApi();
    set({ user: me ?? null, authReady: true });
  },

  setPendingEmail: (email) => set({ pendingEmail: email }),
  clearError: () => set({ error: null }),
}));
