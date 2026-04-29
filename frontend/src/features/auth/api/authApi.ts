import {
  apiRequest,
  setTokens,
  clearTokens,
} from "@/shared/api/client";
import { getTermsDocumentsApi, postTermsConsentsApi } from "./termsApi";

function parseApiError(err: unknown, fallback: string): string {
  const e = err as { message?: string; fieldErrors?: Record<string, string[]> };
  const fieldMsg = e.fieldErrors ? Object.values(e.fieldErrors).flat()[0] : undefined;
  return fieldMsg ?? e.message ?? fallback;
}

/* ── Response types ── */
export interface AuthResponse {
  access: string;
  isEmailConfirmed?: boolean;
}

export interface UserMe {
  name: string;
  email: string;
  isEmailConfirmed: boolean;
  isProfileCompleted: boolean;
  avatarUrl?: string | null;
}

/* ── Sign Up ── */
export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignUpResult {
  success: boolean;
  message: string;
  isEmailConfirmed?: boolean;
}

export async function signUpApi(payload: SignUpPayload): Promise<SignUpResult> {
  try {
    // 1. 약관 목록 조회
    const terms = await getTermsDocumentsApi();

    // 2. 회원가입
    const res = await apiRequest<AuthResponse>("/api/v1/users/sign-up/", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password1: payload.password,
        password2: payload.password,
      }),
    });
    setTokens(res.access, "");

    // 3. 약관 일괄 동의 (토큰 세팅 후 auth 요청)
    if (terms.length > 0) {
      await postTermsConsentsApi(
        terms.map((t) => ({ termsDocumentId: t.id, agreed: true }))
      );
    }

    return {
      success: true,
      message: "회원가입이 완료되었습니다.",
      isEmailConfirmed: res.isEmailConfirmed ?? false,
    };
  } catch (err: unknown) {
    return { success: false, message: parseApiError(err, "회원가입에 실패했습니다.") };
  }
}

/* ── Sign In ── */
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  isEmailConfirmed?: boolean;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResult> {
  try {
    const res = await apiRequest<AuthResponse>("/api/v1/users/sign-in/", {
      method: "POST",
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });
    setTokens(res.access, "");
    return {
      success: true,
      message: "로그인 성공",
      isEmailConfirmed: res.isEmailConfirmed ?? true,
    };
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return {
      success: false,
      message: e.message ?? "이메일 또는 비밀번호가 올바르지 않습니다.",
    };
  }
}

/* ── Sign Out ── */
export async function signOutApi(): Promise<void> {
  try {
    await apiRequest("/api/v1/users/sign-out/", {
      method: "POST",
      auth: true,
      noRetry: true,
    });
  } finally {
    clearTokens();
  }
}

/* ── Verify Email ── */
export interface VerifyEmailResult {
  success: boolean;
  message: string;
}

export async function verifyEmailApi(code: string): Promise<VerifyEmailResult> {
  try {
    await apiRequest("/api/v1/users/verify-email/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ code }),
    });
    return { success: true, message: "이메일 인증이 완료되었습니다." };
  } catch (err: unknown) {
    return { success: false, message: parseApiError(err, "인증 코드가 올바르지 않습니다.") };
  }
}

/* ── Resend Email Verification ── */
export interface ResendVerifyResult {
  success: boolean;
  message: string;
}

export async function resendVerifyEmailApi(): Promise<ResendVerifyResult> {
  try {
    await apiRequest("/api/v1/users/resend-verify-email/", {
      method: "POST",
      auth: true,
    });
    return { success: true, message: "인증 메일이 재발송되었습니다." };
  } catch (err: unknown) {
    const e = err as { message?: string };
    return {
      success: false,
      message: e.message ?? "메일 발송에 실패했습니다.",
    };
  }
}

/* ── Get Current User ── */
export async function getMeApi(options?: { noRetry?: boolean }): Promise<UserMe | null> {
  try {
    return await apiRequest<UserMe>("/api/v1/users/me/", { auth: true, noRetry: options?.noRetry });
  } catch {
    return null;
  }
}

/* ── Change Password ── */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResult {
  success: boolean;
  message: string;
}

export async function changePasswordApi(payload: ChangePasswordPayload): Promise<ChangePasswordResult> {
  try {
    await apiRequest("/api/v1/users/change-password/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        current_password: payload.currentPassword,
        new_password1: payload.newPassword,
        new_password2: payload.newPassword,
      }),
    });
    return { success: true, message: "비밀번호가 변경되었습니다." };
  } catch (err: unknown) {
    return { success: false, message: parseApiError(err, "비밀번호 변경에 실패했습니다.") };
  }
}

/* ── Password Reset ── */
export async function requestPasswordResetApi(email: string): Promise<{ success: boolean; message: string }> {
  try {
    await apiRequest("/api/v1/users/password-reset/", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { success: true, message: "비밀번호 재설정 이메일을 발송했습니다." };
  } catch (err: unknown) {
    return { success: false, message: parseApiError(err, "이메일 발송에 실패했습니다.") };
  }
}

export async function confirmPasswordResetApi(payload: { token: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
  try {
    await apiRequest("/api/v1/users/password-reset/confirm/", {
      method: "POST",
      body: JSON.stringify({
        token: payload.token,
        new_password: payload.newPassword,
      }),
    });
    return { success: true, message: "비밀번호가 변경되었습니다." };
  } catch (err: unknown) {
    return { success: false, message: parseApiError(err, "비밀번호 변경에 실패했습니다.") };
  }
}

/* ── Unregister ── */
export interface UnregisterResult {
  success: boolean;
  message: string;
}

export async function unregisterApi(): Promise<UnregisterResult> {
  try {
    await apiRequest("/api/v1/users/unregister/", {
      method: "DELETE",
      auth: true,
    });
    clearTokens();
    return { success: true, message: "회원탈퇴가 완료되었습니다." };
  } catch (err: unknown) {
    return { success: false, message: parseApiError(err, "회원탈퇴에 실패했습니다.") };
  }
}
