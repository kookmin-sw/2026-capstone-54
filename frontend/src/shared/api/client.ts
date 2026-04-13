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
  options: RequestInit & { auth?: boolean; noRetry?: boolean } = {}
): Promise<T> {
  return _request<T>(path, options, options.noRetry ?? false);
}

/* ── Path validation ── */
function validateApiPath(path: string): { pathname: string; search: string } {
  // Parse relative path using a dummy base to extract pathname vs query string
  const parsed = new URL(path, "http://dummy");
  const pathname = parsed.pathname;
  const search = parsed.search;

  // Only allow paths starting with /api/
  if (!pathname.startsWith("/api/")) {
    throw new Error(`Invalid API path: ${path}. Must start with /api/`);
  }

  // Sanitize pathname only (query string is handled by URL parser)
  const safePath = pathname.replace(/[^/a-zA-Z0-9._~:-]/g, "");

  // Prevent path traversal attacks
  if (safePath.includes("..") || safePath.includes("//")) {
    throw new Error(`Invalid API path: path traversal detected`);
  }

  return { pathname: safePath, search };
}

async function _request<T>(
  path: string,
  options: RequestInit & { auth?: boolean },
  isRetry: boolean
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

  // Validate and sanitize the path
  const { pathname, search } = validateApiPath(path);

  // Construct URL using only trusted base URL and validated path
  const endpoint = new URL(BASE_URL);
  endpoint.pathname = pathname;
  endpoint.search = search;

  const res = await fetch(endpoint.toString(), { ...fetchOptions, headers });

  // No-content responses
  if (res.status === 204 || res.status === 205) return undefined as T;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    // 401 on authenticated request → try token refresh once, then retry
    if (res.status === 401 && auth && !isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return _request<T>(path, options, true);
      }
    }

    const err: ApiError = {
      status: res.status,
      ...(typeof body === "object" && body !== null ? (body as object) : {}),
    };
    throw err;
  }

  return body as T;
}

/* ── Token refresh helper ── */

// refresh 실패 시 호출할 콜백 (순환 의존 방지를 위해 런타임에 등록)
let _onRefreshFailed: (() => void) | null = null;
export function setOnRefreshFailed(cb: () => void) {
  _onRefreshFailed = cb;
}

// 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행되도록 뮤텍스
let _refreshPromise: Promise<boolean> | null = null;

export function refreshAccessToken(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = _doRefresh().finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
}

async function _doRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(new URL("/api/v1/users/tokens/refresh/", BASE_URL).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      clearTokens();
      _onRefreshFailed?.();
      return false;
    }
    const data = await res.json() as { access: string; refresh?: string };
    setTokens(data.access, data.refresh ?? refresh);
    return true;
  } catch {
    clearTokens();
    _onRefreshFailed?.();
    return false;
  }
}
