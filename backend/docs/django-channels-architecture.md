# Django Channels 아키텍처

## 1. 핵심 개념

### WSGI vs ASGI

| 구분 | WSGI | ASGI |
|------|------|------|
| 프로토콜 | HTTP only | HTTP + WebSocket + SSE |
| 처리 방식 | 동기 (요청 1개 → 응답 1개) | 비동기 (연결 유지, 이벤트 스트림) |
| Django 기본 | `wsgi.py` | `asgi.py` |
| 서버 | gunicorn, uWSGI | uvicorn, daphne |

Django Channels 는 Django 를 ASGI 환경으로 확장한다.
HTTP 요청은 기존 Django view 가 그대로 처리하고,
WebSocket / SSE 요청은 Channels consumer 가 처리한다.

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│  Client (Browser / Mobile)                                  │
│                                                             │
│  fetch() / axios    EventSource      WebSocket API          │
│       │                  │                │                 │
└───────┼──────────────────┼────────────────┼─────────────────┘
        │ HTTP             │ HTTP (SSE)     │ WS Upgrade
        ▼                  ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│  uvicorn (ASGI server)                                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ProtocolTypeRouter  (config/asgi.py)                │   │
│  │                                                      │   │
│  │  "http"  ──────────────────► Django ASGI App         │   │
│  │                               (views, DRF, etc.)     │   │
│  │                                                      │   │
│  │  "websocket" ──► AllowedHostsOriginValidator         │   │
│  │                    └─► AuthMiddlewareStack           │   │
│  │                          └─► URLRouter               │   │
│  │                                └─► Consumer          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
        │                                    │
        │ (멀티 Pod / 멀티 프로세스 간 메시지)  │
        ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Redis (Channel Layer)                                      │
│                                                             │
│  group: "user_42"  ──► channel: "specific.abc123"          │
│  group: "room_7"   ──► channel: "specific.xyz789"          │
│                        channel: "specific.def456"          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 구성 요소별 역할

### ProtocolTypeRouter

`config/asgi.py` 에 정의된 최상위 라우터.
들어오는 연결의 프로토콜 타입(`"http"`, `"websocket"`)을 보고 적절한 앱으로 분기한다.

```python
application = ProtocolTypeRouter({
    "http": django_asgi_app,          # 일반 HTTP → Django view
    "websocket": ...,                 # WebSocket → Channels consumer
})
```

### URLRouter

HTTP의 `urls.py` 와 동일한 역할. WebSocket URL 패턴을 consumer 에 매핑한다.

```python
URLRouter([
    path("ws/notifications/", NotificationConsumer.as_asgi()),
    path("ws/chat/<str:room>/", ChatConsumer.as_asgi()),
])
```

### Consumer

Django view 에 대응하는 개념. 연결 수립부터 종료까지의 생명주기를 관리한다.

| 이벤트 | WebSocket | SSE |
|--------|-----------|-----|
| 연결 | `connect()` | `handle()` |
| 메시지 수신 | `receive()` | — |
| 메시지 전송 | `send()` | `send_body()` |
| 연결 종료 | `disconnect()` | `disconnect()` |

### Channel Layer (Redis)

Consumer 인스턴스 간 메시지를 전달하는 메시지 버스.
각 consumer 는 고유한 `channel_name` 을 가지며, 여러 channel 을 묶은 것이 `group` 이다.

```
channel_name: "specific.AbCdEf123"  ← 개별 연결 식별자 (자동 생성)
group:        "user_42"             ← 논리적 그룹 (수동 관리)
```

**group_send** 를 사용하면 그룹에 속한 모든 channel 에 메시지가 전달된다.
이를 통해 같은 사용자가 여러 탭/기기에서 연결해도 모두에게 push 가 가능하다.

---

## 4. 메시지 흐름 (사용자 알림 예시)

```
[Celery Task]
    │
    │  channel_layer.group_send(
    │      "user_42",
    │      {"type": "user.message", "payload": {"text": "주문 완료"}}
    │  )
    │
    ▼
[Redis Channel Layer]
    │  "user_42" 그룹에 속한 모든 channel 에 메시지 전달
    │
    ▼
[Consumer (user_42의 WebSocket 연결)]
    │  type "user.message" → user_message() 메서드 호출
    │  (Channels 는 type의 '.'을 '_'로 변환해 메서드를 찾는다)
    │
    ▼
[Client Browser]
    WebSocket.onmessage 이벤트 발생
```

---

## 5. 프로젝트 파일 구조

```
webapp/
├── config/
│   ├── asgi.py                          # ProtocolTypeRouter 정의
│   └── settings/components/
│       └── channel_layer.py             # CHANNEL_LAYERS 설정 (Redis)
│
└── common/
    └── consumers/
        ├── __init__.py
        ├── websocket.py                 # BaseWebSocketConsumer, UserWebSocketConsumer
        └── sse.py                       # SseConsumer, UserSseConsumer
```

기능별 consumer 는 각 앱 디렉토리에 추가한다:

```
myapp/
├── consumers.py    # Consumer 구현 (common.consumers 상속)
└── routing.py      # websocket_urlpatterns 정의
```

---

## 6. Channel Layer 설정

`config/settings/components/channel_layer.py`:

```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(REDIS_HOST, int(REDIS_PORT))],
        },
    }
}
```

development / production 모두 Redis 를 사용한다.
멀티 프로세스(uvicorn `--workers`) 또는 멀티 Pod 환경에서
프로세스 간 메시지 전달이 Redis 를 통해 이루어진다.

---

## 7. AuthMiddlewareStack

WebSocket 연결 시 Django 세션/쿠키 기반 인증을 자동으로 처리한다.
`scope["user"]` 에 인증된 사용자가 주입된다.

단, JWT 기반 프로젝트에서는 쿠키 인증이 아닌 **쿼리스트링 token** 방식을 사용한다.
`UserWebSocketConsumer._authenticate()` 참고.
