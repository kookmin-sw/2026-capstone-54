export const BASE_URL = "https://mefit.xn--hy1by51c.kr";

/* ── Token helpers ── */
export function getAccessToken(): string | null {
  return localStorage.getItem("mefit_access");
}
export function getRefreshToken(): string | null {
  return localStorage.getItem("mefit_refresh");
}
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem("mefit_access", access);
  localStorage.setItem("mefit_refresh", refresh);
}
export function clearTokens(): void {
  localStorage.removeItem("mefit_access");
  localStorage.removeItem("mefit_refresh");
}

/* ── Error type ── */
export interface ApiError {
  status: number;
  errorCode?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e;
}
export { isApiError };

/* ── Core fetch wrapper ── */
export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });

  // No-content responses
  if (res.status === 204 || res.status === 205) return undefined as T;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      ...(typeof body === "object" && body !== null ? (body as object) : {}),
    };
    throw err;
  }

  return body as T;
}

/* ── Token refresh helper ── */
export async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await apiRequest<{ access: string }>(
      "/api/v1/users/tokens/refresh/",
      { method: "POST", body: JSON.stringify({ refresh }) }
    );
    setTokens(res.access, refresh);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}
