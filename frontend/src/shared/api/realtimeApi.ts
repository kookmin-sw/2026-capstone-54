import { apiRequest, BASE_URL } from "./client";

/* ── WebSocket 티켓 발급 ── */
async function fetchWsTicket(): Promise<string | null> {
  try {
    const res = await apiRequest<{ ticket: string }>("/api/v1/realtime/ws-ticket/", {
      method: "POST",
      auth: true,
    });
    return res.ticket;
  } catch {
    return null;
  }
}

/* ── WebSocket URL 생성 (https → wss) ── */
function buildWsUrl(ticket: string): string {
  const wsBase = BASE_URL.replace(/^https/, "wss").replace(/^http/, "ws");
  return `${wsBase}/ws/notifications/?ticket=${ticket}`;
}

export type WsNotificationMessage = {
  id: number;
  message: string;
  category: "interview" | "resume" | "jd" | "system";
  createdAt: string;
};

type WsEventHandlers = {
  onMessage: (msg: WsNotificationMessage) => void;
  onClose?: () => void;
};

/* ── WebSocket 연결 관리 ── */
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers: WsEventHandlers;
  private stopped = false;

  constructor(handlers: WsEventHandlers) {
    this.handlers = handlers;
  }

  async connect() {
    this.stopped = false;
    const ticket = await fetchWsTicket();
    if (!ticket) return;

    const url = buildWsUrl(ticket);
    this.ws = new WebSocket(url);

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WsNotificationMessage;
        this.handlers.onMessage(data);
      } catch {
        // 파싱 실패 무시
      }
    };

    this.ws.onclose = () => {
      this.handlers.onClose?.();
      // 연결 끊기면 5초 후 재연결 (stopped가 아닐 때만)
      if (!this.stopped) {
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
