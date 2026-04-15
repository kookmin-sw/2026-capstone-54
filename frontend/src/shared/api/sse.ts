/** JWT 인증 SSE 스트림 — 401 자동 refresh, 예상치 못한 종료/네트워크 오류 시 지수 백오프 재연결. */

import { BASE_URL, getAccessToken, refreshAccessToken } from "./client";

type SseEventHandler = (event: string, data: unknown) => void;

export interface OpenSseOptions {
  /** 치명적 오류(재연결 실패/한도 초과/refresh 실패) 시 호출. */
  onError?: (err: Error) => void;
  /** 스트림이 자연 종료되었고 더 이상 재연결할 이유가 없을 때 호출. */
  onDone?: () => void;
  /**
   * 자연 종료/전송 오류 이후 재연결 여부를 결정.
   *  - false 반환 → 재연결 없이 onDone 호출하고 종료.
   *  - true 반환  → 즉시(자연 종료) 또는 백오프 후(오류) 재연결.
   * 기본: 항상 false (단발성 스트림).
   */
  shouldReconnect?: () => boolean;
  /** 네트워크/전송 오류로 인한 재연결 최대 시도 횟수. 기본 5. */
  maxReconnectAttempts?: number;
}

/**
 * JWT 인증 SSE 스트림 연결.
 * 반환값은 연결 취소 함수. 취소 시 진행 중인 fetch / 대기 중인 재연결 백오프까지 모두 중단한다.
 *
 *   const cancel = openSseStream("/sse/.../status/", (event, data) => { ... }, {
 *     shouldReconnect: () => !terminalFired,
 *     onError: (e) => showToast(e.message),
 *   });
 *   // 정리 시: cancel()
 */
export function openSseStream(
  path: string,
  onEvent: SseEventHandler,
  options: OpenSseOptions = {},
): () => void {
  const { onError, onDone, shouldReconnect, maxReconnectAttempts = 5 } = options;
  const controller = new AbortController();
  let cancelled = false;
  let errorAttempts = 0;

  const loop = async () => {
    while (!cancelled) {
      const outcome = await connectOnce(path, onEvent, controller.signal);
      if (cancelled) return;

      if (outcome.kind === "eof") {
        errorAttempts = 0;
        if (shouldReconnect?.()) {
          // 정상 종료지만 caller 가 계속 받고 싶어함 → 짧은 간격 후 재연결
          const aborted = await sleepWithAbort(500, controller.signal);
          if (aborted || cancelled) return;
          continue;
        }
        onDone?.();
        return;
      }

      // outcome.kind === "error"
      if (!shouldReconnect?.() || errorAttempts >= maxReconnectAttempts) {
        onError?.(outcome.error);
        return;
      }
      errorAttempts += 1;
      const delay = Math.min(30_000, 500 * 2 ** (errorAttempts - 1));
      const aborted = await sleepWithAbort(delay, controller.signal);
      if (aborted || cancelled) return;
    }
  };

  void loop();

  return () => {
    cancelled = true;
    controller.abort();
  };
}

type ConnectOutcome = { kind: "eof" } | { kind: "error"; error: Error };

async function connectOnce(
  path: string,
  onEvent: SseEventHandler,
  signal: AbortSignal,
): Promise<ConnectOutcome> {
  try {
    const res = await fetchWithAuthRetry(path, signal);
    if (!res.ok || !res.body) {
      return { kind: "error", error: new Error(`SSE ${res.status}`) };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "message";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const dataStr = line.slice(5).trim();
          try {
            onEvent(currentEvent, JSON.parse(dataStr));
          } catch {
            onEvent(currentEvent, dataStr);
          }
          currentEvent = "message";
        } else if (line === "") {
          currentEvent = "message";
        }
      }
    }
    return { kind: "eof" };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { kind: "eof" };
    }
    return { kind: "error", error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/** 401 을 만나면 refresh 를 한 번 시도하고 재요청한다. */
async function fetchWithAuthRetry(path: string, signal: AbortSignal): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  const doFetch = (token: string | null) =>
    fetch(url, {
      headers: {
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal,
    });

  let res = await doFetch(getAccessToken());
  if (res.status === 401) {
    // 기존 응답 body 는 해제 (누수 방지)
    try { await res.body?.cancel(); } catch { /* noop */ }
    const ok = await refreshAccessToken();
    if (!ok) {
      return res;
    }
    res = await doFetch(getAccessToken());
  }
  return res;
}

/** abort 를 감지하는 sleep. 반환값 true 면 abort 되어 중단해야 함을 의미. */
function sleepWithAbort(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(true);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      resolve(true);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve(false);
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
