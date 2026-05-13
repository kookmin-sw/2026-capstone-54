# React.js 실시간 연동 가이드

## 전제 조건

- JWT access token 을 `localStorage` 또는 메모리에 보관하고 있다고 가정한다.
- 백엔드 URL: `http://localhost:8000` (개발), `https://api.example.com` (운영)

---

## 1. WebSocket 연동

### 기본 훅

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from "react";

type MessageHandler = (data: unknown) => void;

interface UseWebSocketOptions {
  url: string;
  onMessage: MessageHandler;
  onOpen?: () => void;
  onClose?: (code: number) => void;
  enabled?: boolean;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!enabled) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] connected");
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        onMessage(event.data);
      }
    };

    ws.onclose = (event) => {
      console.log("[WS] closed", event.code);
      onClose?.(event.code);

      // 4001 = 인증 실패 — 재연결하지 않는다
      if (event.code !== 4001 && event.code !== 1000) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("[WS] error", error);
    };
  }, [url, onMessage, onOpen, onClose, enabled]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close(1000);
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}
```

### 사용자 알림 WebSocket 훅 (티켓 방식)

```typescript
// hooks/useNotificationWebSocket.ts
import { useCallback, useEffect, useRef, useState } from "react";

const WS_BASE = process.env.REACT_APP_WS_URL ?? "ws://localhost:8000";
const API_BASE = process.env.REACT_APP_API_URL ?? "http://localhost:8000";

async function fetchWsTicket(accessToken: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/api/v1/realtime/ws-ticket/`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const { ticket } = await res.json();
  return ticket;
}

interface Notification {
  type: string;
  [key: string]: unknown;
}

export function useNotificationWebSocket(
  accessToken: string | null,
  onNotification: (notification: Notification) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(async () => {
    if (!accessToken) return;

    const ticket = await fetchWsTicket(accessToken);
    if (!ticket) { console.error("[WS] failed to get ticket"); return; }

    const ws = new WebSocket(`${WS_BASE}/ws/notifications/?ticket=${ticket}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try { onNotification(JSON.parse(event.data)); }
      catch { /* ignore */ }
    };

    ws.onclose = (event) => {
      if (event.code !== 4001 && event.code !== 1000) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };
  }, [accessToken, onNotification]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close(1000);
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}
```

### 컴포넌트에서 사용

```tsx
// components/NotificationBell.tsx
import { useState, useCallback } from "react";
import { useNotificationWebSocket } from "../hooks/useNotificationWebSocket";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const accessToken = localStorage.getItem("access_token");

  const handleNotification = useCallback((data: unknown) => {
    const msg = data as { type: string; [key: string]: unknown };

    if (msg.type === "unread_count") {
      console.log("미확인 알림:", msg.count);
    } else if (msg.type === "order_completed") {
      setNotifications((prev) => [msg, ...prev]);
    }
  }, []);

  const { send } = useNotificationWebSocket(accessToken, handleNotification);

  const markRead = (notificationId: number) => {
    send({ action: "mark_read", notification_id: notificationId });
  };

  return (
    <div>
      {notifications.map((n, i) => (
        <div key={i} onClick={() => markRead((n as { id: number }).id)}>
          {JSON.stringify(n)}
        </div>
      ))}
    </div>
  );
}
```

---

## 2. SSE 연동 — fetch + ReadableStream (Authorization 헤더)

브라우저 `EventSource` API 는 커스텀 헤더를 지원하지 않으므로 `fetch()` + `ReadableStream` 방식을 사용한다.

```typescript
// hooks/useSSEFetch.ts
import { useEffect, useRef, useCallback } from "react";

interface UseSSEFetchOptions {
  url: string;
  accessToken: string | null;
  onMessage: (data: unknown, eventType?: string) => void;
  enabled?: boolean;
}

export function useSSEFetch({
  url,
  accessToken,
  onMessage,
  enabled = true,
}: UseSSEFetchOptions) {
  const abortRef = useRef<AbortController | null>(null);

  const connect = useCallback(async () => {
    if (!enabled || !accessToken) return;

    abortRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/event-stream",
        },
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        console.error("[SSE] failed to connect", response.status);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const block of parts) {
          let eventName = "message", data = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) data = line.slice(5).trim();
          }
          try { onMessage(JSON.parse(data), eventName); }
          catch { onMessage(data, eventName); }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("[SSE] error", error);
        setTimeout(connect, 3000);
      }
    }
  }, [url, accessToken, onMessage, enabled]);

  useEffect(() => {
    connect();
    return () => { abortRef.current?.abort(); };
  }, [connect]);
}
```

---

## 3. 환경 변수 설정

`.env` (React 프로젝트 루트):

```
# HTTP API
REACT_APP_API_URL=http://localhost:8000

# WebSocket (ws:// 또는 wss://)
REACT_APP_WS_URL=ws://localhost:8000
```

운영 환경:

```
REACT_APP_API_URL=https://api.example.com
REACT_APP_WS_URL=wss://api.example.com
```

> HTTPS 도메인에서는 반드시 `wss://` (WebSocket Secure) 를 사용해야 한다.
> `ws://` 는 Mixed Content 오류로 차단된다.

---

## 4. 토큰 갱신 처리

WebSocket 은 연결 수립 시 티켓을 1회 사용하므로, 재연결 시마다 새 티켓을 발급받는다.
티켓 발급 API 가 401 을 반환하면 access token 이 만료된 것이므로 refresh token 으로 갱신한다.

```typescript
async function fetchWsTicket(accessToken: string): Promise<string | null> {
  const res = await fetch("/api/v1/realtime/ws-ticket/", {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (res.status === 401) {
    // access token 만료 → refresh 후 재시도
    const newToken = await refreshAccessToken();
    if (!newToken) return null;
    return fetchWsTicket(newToken);
  }
  if (!res.ok) return null;
  const { ticket } = await res.json();
  return ticket;
}
```

SSE 는 연결 시 Authorization 헤더로 토큰을 전달하므로, 재연결 시 최신 토큰을 사용하면 된다.
```

---

## 5. CORS / 허용 호스트 설정

백엔드 `ALLOWED_HOSTS` 와 `CORS_ALLOWED_ORIGINS` 에 프론트엔드 도메인을 추가해야 한다.

```python
# .env
ALLOWED_HOSTS=localhost,127.0.0.1,api.example.com

# settings (django-cors-headers 사용 시)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://app.example.com",
]
```

WebSocket 은 `AllowedHostsOriginValidator` 가 `ALLOWED_HOSTS` 를 기준으로 Origin 을 검증한다.

---

## 6. 연결 흐름 요약

```
React 앱 마운트
    │
    ├── WebSocket 연결 (티켓 방식)
    │       │
    │       ├── POST /api/v1/realtime/ws-ticket/  (Authorization: Bearer <token>)
    │       │       → {"ticket": "<60초 유효 1회용 티켓>"}
    │       │
    │       ├── ws://host/ws/notifications/?ticket=<ticket>
    │       │       → 연결 성공 → 메시지 수신 대기
    │       │       → 연결 실패 (4001) → 3초 후 재시도
    │       │
    │       └── 티켓 발급 실패 (401) → 로그인 페이지로 이동
    │
    └── SSE 연결 (Authorization 헤더)
            │
            ├── GET /sse/notifications/  (Authorization: Bearer <token>)
            │       → 200 OK → text/event-stream 수신 시작
            │       → 401 → 로그인 페이지로 이동
            │
            └── 연결 끊김 → 3초 후 재연결
```
