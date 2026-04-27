/** Interview-session 전용 WebSocket 클라이언트 (eviction 4409 처리). */
import { BASE_URL } from "@/shared/api/client";

export const WS_CLOSE_EVICTED = 4409;
export const WS_CLOSE_SESSION_NOT_FOUND = 4004;

type Handlers = {
  onMessage?: (data: Record<string, unknown>) => void;
  onEvicted?: () => void;
  onClose?: (code: number) => void;
  onOpen?: () => void;
};

function buildSessionWsUrl(sessionUuid: string, ticket: string): string {
  const wsBase = BASE_URL.replace(/^https/, "wss").replace(/^http/, "ws");
  return `${wsBase}/ws/interviews/${sessionUuid}/?ticket=${encodeURIComponent(ticket)}`;
}

export class InterviewSessionWsClient {
  private ws: WebSocket | null = null;
  private stopped = false;
  private handlers: Handlers;

  constructor(handlers: Handlers) {
    this.handlers = handlers;
  }

  connect(sessionUuid: string, ticket: string) {
    this.stopped = false;
    const url = buildSessionWsUrl(sessionUuid, ticket);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.handlers.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;
        this.handlers.onMessage?.(data);
      } catch {
        /* invalid json — ignore */
      }
    };

    this.ws.onclose = (event) => {
      this.handlers.onClose?.(event.code);
      if (event.code === WS_CLOSE_EVICTED && !this.stopped) {
        this.handlers.onEvicted?.();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  send(payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  disconnect() {
    this.stopped = true;
    this.ws?.close();
    this.ws = null;
  }
}
