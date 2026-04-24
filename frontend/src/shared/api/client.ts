export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://mefit.xn--hy1by51c.kr";

// 단일 인증 전략: access token(in-memory) + refresh token(HttpOnly cookie)

/* ── Token helpers ── */
export function getAccessToken(): string | null {
  return _accessToken;
}
export function getRefreshToken(): string | null {
  return null;
}
export function setTokens(access: string, refresh: string): void {
  void refresh; // refresh 토큰은 HttpOnly cookie로만 관리
  _accessToken = access;
}
export function clearTokens(): void {
  _accessToken = null;
}

let _accessToken: string | null = null;

/* ── Paginated Response ── */
export interface PaginatedResponse<T> {
  count: number;
  totalPagesCount: number;
  nextPage: number | null;
  previousPage: number | null;
  hasHiddenOlderSessions?: boolean;
  results: T[];
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
  return _request<T>(path, options, false, options.noRetry ?? false);
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

function validateTrustedPath(path: string): { pathname: string; search: string } {
  const parsed = new URL(path, "http://dummy");
  const pathname = parsed.pathname;
  const search = parsed.search;

  const isApiPath = pathname.startsWith("/api/");
  const isVoiceApiPath = pathname.startsWith("/voice-api/api/v1/");
  if (!isApiPath && !isVoiceApiPath) {
    throw new Error(`Invalid trusted path: ${path}`);
  }

  const safePath = pathname.replace(/[^/a-zA-Z0-9._~:-]/g, "");
  if (safePath.includes("..") || safePath.includes("//")) {
    throw new Error("Invalid trusted path: path traversal detected");
  }

  return { pathname: safePath, search };
}

function isAuthRetryExcludedPath(pathname: string): boolean {
  return pathname === "/api/v1/users/tokens/refresh/" || pathname === "/api/v1/users/sign-out/";
}

async function _request<T>(
  path: string,
  options: RequestInit & { auth?: boolean },
  isRetry: boolean,
  noRetry: boolean,
): Promise<T> {
  const { auth = false, ...fetchOptions } = options as RequestInit & { auth?: boolean; noRetry?: boolean };
  delete (fetchOptions as Record<string, unknown>).noRetry;

  // FormData일 때는 Content-Type을 브라우저에 맡김 (multipart/form-data + boundary 자동 설정)
  const isFormData = fetchOptions.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
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

  const res = await fetch(endpoint.toString(), {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

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
    if (
      res.status === 401
      && auth
      && !isRetry
      && !noRetry
      && !isAuthRetryExcludedPath(pathname)
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return _request<T>(path, options, true, noRetry);
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

/* ── Authenticated fetch with 401 retry (for raw fetch calls outside apiRequest) ── */

export async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const { pathname, search } = validateTrustedPath(path);
  const endpoint = new URL(BASE_URL);
  endpoint.pathname = pathname;
  endpoint.search = search;

  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(endpoint.toString(), {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !isAuthRetryExcludedPath(pathname)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      const retryHeaders = new Headers(options.headers);
      if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`);
      return fetch(endpoint.toString(), {
        ...options,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  return res;
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
  const onRefreshFailed = _onRefreshFailed;
  try {
    const res = await fetch(new URL("/api/v1/users/tokens/refresh/", BASE_URL).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) {
      clearTokens();
      onRefreshFailed?.();
      return false;
    }
    const data = await res.json() as { access: string };
    setTokens(data.access, "");
    return true;
  } catch {
    clearTokens();
    onRefreshFailed?.();
    return false;
  }
}
