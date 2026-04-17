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
  notifiableType: string | null;
  notifiableId: string | null;
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
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  constructor(handlers: WsEventHandlers) {
    this.handlers = handlers;
  }

  async connect() {
    this.stopped = false;
    const ticket = await fetchWsTicket();
    if (!ticket) return;

    const url = buildWsUrl(ticket);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.retryCount = 0; // 연결 성공 시 재시도 카운트 초기화
    };

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
      if (!this.stopped && this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        const delay = Math.min(5000 * this.retryCount, 30000); // 5s, 10s, 15s
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
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
