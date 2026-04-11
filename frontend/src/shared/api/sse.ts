import { BASE_URL, getAccessToken } from "./client";

type SseEventHandler = (event: string, data: unknown) => void;

/**
 * JWT 인증 SSE 스트림 연결.
 * 반환값은 연결 취소 함수.
 *
 * 사용 예:
 *   const cancel = openSseStream(
 *     "/sse/interviews/<uuid>/report-status/",
 *     (event, data) => { ... },
 *   );
 *   // 정리 시: cancel()
 */
export function openSseStream(
  path: string,
  onEvent: SseEventHandler,
  onError?: (err: Error) => void,
  onDone?: () => void,
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const token = getAccessToken();
      const url = `${BASE_URL}${path}`;

      const res = await fetch(url, {
        headers: {
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        onError?.(new Error(`SSE ${res.status}`));
        return;
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
      onDone?.();
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    }
  })();

  return () => controller.abort();
}
