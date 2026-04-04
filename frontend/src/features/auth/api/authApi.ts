import { apiRequest, setTokens, clearTokens, getRefreshToken } from "@/shared/api/client";

function parseApiError(err: unknown, fallback: string): string {
  const e = err as { message?: string; fieldErrors?: Record<string, string[]> };
  const fieldMsg = e.fieldErrors ? Object.values(e.fieldErrors).flat()[0] : undefined;
  return fieldMsg ?? e.message ?? fallback;
}

/* ── Response types ── */
export interface AuthResponse {
  access: string;
  refresh: string;
  isEmailConfirmed?: boolean;
}

export interface UserMe {
  name: string;
  email: string;
  isEmailConfirmed: boolean;
  isProfileCompleted: boolean;
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
    const res = await apiRequest<AuthResponse>("/api/v1/users/sign-up/", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password1: payload.password,
        password2: payload.password,
      }),
    });
    setTokens(res.access, res.refresh);
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
    setTokens(res.access, res.refresh);
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
  const refresh = getRefreshToken();
  try {
    await apiRequest("/api/v1/users/sign-out/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ refresh: refresh ?? "" }),
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
export async function getMeApi(): Promise<UserMe | null> {
  try {
    return await apiRequest<UserMe>("/api/v1/users/me/", { auth: true });
  } catch {
    return null;
  }
}
