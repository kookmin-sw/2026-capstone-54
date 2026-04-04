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
import { getAccessToken } from "@/shared/api/client";

interface LoginResult {
  success: boolean;
  isEmailConfirmed?: boolean;
}

interface AuthState {
  user: UserMe | null;
  isLoading: boolean;
  error: string | null;
  pendingEmail: string | null;

  signUp: (payload: { name: string; nickname: string; email: string; password: string }) => Promise<boolean>;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  fetchMe: () => Promise<void>;
  setPendingEmail: (email: string) => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  error: null,
  pendingEmail: null,

  isAuthenticated: () => !!getAccessToken(),

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
    set({ isLoading: false, pendingEmail: email });
    return { success: true, isEmailConfirmed: res.isEmailConfirmed };
  },

  logout: async () => {
    set({ isLoading: true });
    await signOutApi();
    set({ user: null, isLoading: false, pendingEmail: null, error: null });
  },

  verifyCode: async (code) => {
    set({ isLoading: true, error: null });
    const res = await verifyEmailApi(code);
    if (!res.success) {
      set({ isLoading: false, error: res.message });
      return false;
    }
    set({ isLoading: false });
    return true;
  },

  resendVerification: async () => {
    set({ isLoading: true, error: null });
    const res = await resendVerifyEmailApi();
    if (!res.success) {
      set({ isLoading: false, error: res.message });
      return false;
    }
    set({ isLoading: false });
    return true;
  },

  fetchMe: async () => {
    const me = await getMeApi();
    if (me) set({ user: me });
  },

  setPendingEmail: (email) => set({ pendingEmail: email }),
  clearError: () => set({ error: null }),
}));
