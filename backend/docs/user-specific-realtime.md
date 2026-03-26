# 특정 사용자 전용 실시간 통신

## 개요

특정 사용자에게만 메시지를 전달하는 패턴.
`user_{user_id}` 그룹을 통해 해당 사용자의 모든 연결(멀티 탭/기기)에 동시 push 가 가능하다.

```
[Celery Task / View]
    │
    │  group_send("user_42", {...})
    ▼
[Redis Channel Layer]
    │
    ├──► [WebSocket Consumer — 탭 A]  → 브라우저 탭 A
    ├──► [WebSocket Consumer — 탭 B]  → 브라우저 탭 B
    └──► [SSE Consumer — 모바일]      → 모바일 앱
```

---

## 1. 인증 방식

### WebSocket — 단기 티켓 방식

브라우저 WebSocket API 는 커스텀 헤더를 지원하지 않는다.
JWT 를 쿼리스트링에 직접 노출하면 서버 로그에 기록될 수 있으므로 **단기 티켓** 방식을 사용한다.

```
# 1단계: 티켓 발급 (HTTP, Authorization 헤더 사용)
POST /api/v1/realtime/ws-ticket/
Authorization: Bearer <access_token>
→ {"ticket": "<60초 유효 1회용 티켓>"}

# 2단계: 티켓으로 WebSocket 연결
ws://host/ws/notifications/?ticket=<ticket>
```

`UserWebSocketConsumer._authenticate()` 가 연결 시점에 티켓을 검증하고 즉시 삭제한다.
실패 시 close code `4001` 로 연결을 거부한다.

### SSE — Authorization 헤더 방식

SSE 는 `fetch()` + `ReadableStream` 방식으로 연결하면 `Authorization: Bearer` 헤더를 사용할 수 있다.
브라우저 `EventSource` API 는 커스텀 헤더를 지원하지 않으므로 이 방식을 권장한다.

```
GET /sse/notifications/
Authorization: Bearer <access_token>
```

`UserSseConsumer._authenticate()` 가 Authorization 헤더에서 토큰을 추출한다.
실패 시 HTTP 401 을 반환한다.

---

## 2. 그룹 이름 규칙

```python
group_name = f"user_{user.pk}"   # 예: "user_42"
```

Consumer 연결 시 자동으로 이 그룹에 참가하고, 연결 종료 시 자동으로 탈퇴한다.

---

## 3. WebSocket — UserWebSocketConsumer

### 기본 사용

```python
# myapp/consumers.py
from common.consumers import UserWebSocketConsumer

class NotificationConsumer(UserWebSocketConsumer):
    """사용자 알림 WebSocket consumer."""

    async def handle_connect(self) -> None:
        # 연결 직후 미확인 알림 수 전송 (선택)
        count = await self._get_unread_count()
        await self.reply({"type": "unread_count", "count": count})

    async def handle_message(self, data: dict) -> None:
        # 클라이언트 → 서버 메시지 처리 (필요 시)
        if data.get("action") == "mark_read":
            await self._mark_read(data.get("notification_id"))
            await self.reply({"type": "marked_read"})

    async def _get_unread_count(self) -> int:
        from notifications.models import Notification
        return await Notification.objects.filter(
            user=self.user, read_at__isnull=True
        ).acount()

    async def _mark_read(self, notification_id: int) -> None:
        from notifications.models import Notification
        from django.utils import timezone
        await Notification.objects.filter(
            pk=notification_id, user=self.user
        ).aupdate(read_at=timezone.now())
```

### URL 등록

```python
# myapp/routing.py
from django.urls import path
from .consumers import NotificationConsumer

websocket_urlpatterns = [
    path("ws/notifications/", NotificationConsumer.as_asgi()),
]
```

```python
# config/asgi.py — websocket_urlpatterns 에 추가
from myapp.routing import websocket_urlpatterns as myapp_ws

websocket_urlpatterns = [
    *myapp_ws,
]
```

### 티켓 발급 → WebSocket 연결 (JavaScript)

```javascript
// 1. 티켓 발급
const { ticket } = await fetch("/api/v1/realtime/ws-ticket/", {
  method: "POST",
  headers: { "Authorization": `Bearer ${accessToken}` },
}).then(r => r.json());

// 2. 티켓으로 WebSocket 연결 (60초 이내)
const ws = new WebSocket(`ws://host/ws/notifications/?ticket=${ticket}`);
```

### 외부에서 특정 사용자에게 push

```python
# 동기 컨텍스트 (Celery task, Django view 등)
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def notify_user(user_id: int, payload: dict) -> None:
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type": "user.message",   # → consumer.user_message() 호출
            "payload": payload,
        },
    )

# 사용 예
notify_user(42, {"type": "order_completed", "order_id": 123})
```

```python
# 비동기 컨텍스트
from channels.layers import get_channel_layer

async def notify_user_async(user_id: int, payload: dict) -> None:
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"user_{user_id}",
        {"type": "user.message", "payload": payload},
    )
```

---

## 4. SSE — UserSseConsumer

### 기본 사용

```python
# myapp/consumers.py
import asyncio
from common.consumers import UserSseConsumer

class NotificationSseConsumer(UserSseConsumer):
    """사용자 알림 SSE consumer."""

    async def stream(self) -> None:
        # 연결 직후 초기 이벤트
        await self.send_event({"type": "connected"}, event="connected")

        # 연결 유지 (heartbeat)
        # 실제 메시지는 sse_push() 핸들러를 통해 group_send로 수신한다
        while not self.disconnected:
            await asyncio.sleep(30)
            await self.send_event("", event="heartbeat")
```

### URL 등록

SSE 는 HTTP consumer 이므로 `config/urls.py` 에 등록한다.

```python
# config/urls.py
from django.urls import re_path
from myapp.consumers import NotificationSseConsumer

urlpatterns += [
    re_path(r"^sse/notifications/$", NotificationSseConsumer.as_asgi()),
]
```

### SSE 연결 (JavaScript — fetch + ReadableStream)

```javascript
// Authorization 헤더를 사용하므로 fetch() 방식으로 연결한다
const res = await fetch("/sse/notifications/", {
  headers: { "Authorization": `Bearer ${accessToken}` },
});
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buf = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  const parts = buf.split("\n\n");
  buf = parts.pop();
  for (const block of parts) {
    const dataLine = block.split("\n").find(l => l.startsWith("data:"));
    if (dataLine) console.log(JSON.parse(dataLine.slice(5)));
  }
}
```

### 외부에서 특정 사용자에게 push

SSE consumer 도 WebSocket 과 동일하게 `group_send` 를 사용할 수 있다.

```python
# 동기 컨텍스트 (Celery task, Django view 등)
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def notify_user(user_id: int, payload: dict) -> None:
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type": "sse.push",   # → consumer.sse_push() 호출
            "payload": payload,
        },
    )

# 사용 예
notify_user(42, {"type": "order_completed", "order_id": 123})
```

```python
# 비동기 컨텍스트
from channels.layers import get_channel_layer

async def notify_user_async(user_id: int, payload: dict) -> None:
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"user_{user_id}",
        {"type": "sse.push", "payload": payload},
    )
```

> SSE 는 단방향(서버 → 클라이언트)이지만, 그룹 broadcast 를 통해
> 동일 사용자의 모든 연결(멀티 탭/기기)에 동시에 메시지를 전달할 수 있다.

---

## 5. WebSocket vs SSE 선택 기준

| 상황 | 권장 |
|------|------|
| 서버 → 클라이언트 단방향 알림 | SSE |
| 클라이언트 ↔ 서버 양방향 통신 | WebSocket |
| 채팅, 실시간 협업 | WebSocket |
| 알림, 피드, 진행률 표시 | SSE |
| 브라우저 EventSource 재연결 자동화 필요 | SSE |
| 바이너리 데이터 전송 | WebSocket |

---

## 6. 멀티 탭 / 멀티 기기 동작

같은 사용자가 여러 탭이나 기기에서 연결하면 모두 `user_{id}` 그룹에 참가한다.
`group_send` 를 사용하면 모든 연결에 동시에 메시지가 전달된다.

```
user_42 그룹
  ├── channel: "specific.abc" (탭 A WebSocket)
  ├── channel: "specific.def" (탭 B WebSocket)
  └── channel: "specific.ghi" (모바일 SSE)

group_send("user_42", {...})
  → 세 연결 모두에 메시지 전달
```
