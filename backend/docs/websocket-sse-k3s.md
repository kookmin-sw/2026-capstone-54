# WebSocket / SSE — k3s 배포 가이드

## 아키텍처 개요

```
Client
  │  HTTP / WebSocket / SSE
  ▼
Ingress (Traefik — k3s 기본)
  │
  ▼
Service (ClusterIP)
  │
  ▼
Pod (uvicorn + Django Channels ASGI)
  │
  ▼
Redis (channel layer — 멀티 Pod 간 메시지 브로드캐스트)
```

k3s는 기본적으로 **Traefik**을 Ingress Controller로 사용한다.
WebSocket은 HTTP Upgrade 핸드셰이크가 필요하므로 Ingress에 별도 설정이 필요하다.

---

## 1. ASGI 서버 실행 (uvicorn)

`uvicorn[standard]`는 이미 의존성에 포함되어 있다.
production에서는 `runserver` 대신 uvicorn으로 실행한다.

```bash
uvicorn config.asgi:application \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4
```

> `--workers` 옵션을 사용하면 멀티 프로세스로 실행된다.
> 각 프로세스가 독립적이므로 **Redis channel layer가 필수**다 (InMemoryChannelLayer는 프로세스 간 공유 불가).

---

## 2. Traefik Ingress 설정

### WebSocket

Traefik은 WebSocket Upgrade를 기본 지원하므로 별도 annotation이 필요 없다.
단, 타임아웃 기본값(60s)이 짧으므로 장시간 연결을 위해 늘려준다.

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: backend-ingress
  annotations:
    # 응답 타임아웃 — WebSocket 장시간 유지
    traefik.ingress.kubernetes.io/router.middlewares: "default-ws-timeout@kubernetescrd"
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 8000
```

타임아웃 미들웨어 (선택):

```yaml
# k8s/middleware-ws-timeout.yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: ws-timeout
spec:
  forwardingTimeouts:
    responseHeaderTimeout: 0s   # 0 = 무제한
    idleConnTimeout: 0s
```

### SSE

SSE는 일반 HTTP long-response이므로 WebSocket과 동일한 Ingress를 사용한다.
단, nginx 계열 Ingress를 사용하는 경우 버퍼링을 비활성화해야 한다.

```yaml
# nginx ingress 사용 시 추가 annotation
nginx.ingress.kubernetes.io/proxy-buffering: "off"
nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
```

> `SseConsumer`는 이미 `X-Accel-Buffering: no` 헤더를 전송하므로
> nginx 리버스 프록시 버퍼링은 자동으로 비활성화된다.

---

## 3. 멀티 Pod 운영 시 주의사항

### Redis channel layer 필수

Pod가 2개 이상이면 WebSocket 연결이 서로 다른 Pod에 분산된다.
`channels_redis.core.RedisChannelLayer`를 사용하면 Pod 간 메시지가 Redis를 통해 전달된다.

현재 설정 (`config/settings/components/channel_layer.py`):

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

`REDIS_HOST` / `REDIS_PORT`는 `.env`에서 주입된다.
production에서는 Redis Service의 ClusterIP 또는 외부 Redis 주소를 사용한다.

### Sticky session (선택)

channel layer를 사용하면 sticky session 없이도 동작하지만,
연결 수립 시 HTTP → WebSocket Upgrade 핸드셰이크가 동일 Pod에서 처리되어야 한다.
Traefik에서 sticky session을 활성화하려면:

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  annotations:
    traefik.ingress.kubernetes.io/service.sticky.cookie: "true"
    traefik.ingress.kubernetes.io/service.sticky.cookie.name: "ws_affinity"
```

---

## 4. Redis 배포

k3s 클러스터 내에 Redis를 배포하거나 외부 Redis를 사용한다.

### 클러스터 내 Redis (단순 구성)

```yaml
# k8s/redis.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:8
          ports:
            - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis
spec:
  selector:
    app: redis
  ports:
    - port: 6379
```

`.env` (또는 k8s Secret):

```
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 5. 새 Consumer 추가 방법

### WebSocket

```python
# myapp/consumers.py
from common.consumers import BaseWebSocketConsumer

class MyConsumer(BaseWebSocketConsumer):
    async def handle_connect(self):
        await self.channel_layer.group_add("my_group", self.channel_name)

    async def handle_disconnect(self, code):
        await self.channel_layer.group_discard("my_group", self.channel_name)

    async def handle_message(self, data):
        await self.channel_layer.group_send(
            "my_group",
            {"type": "broadcast", "payload": data},
        )

    async def broadcast(self, event):
        await self.reply(event["payload"])
```

```python
# myapp/routing.py
from django.urls import path
from .consumers import MyConsumer

websocket_urlpatterns = [
    path("ws/my/", MyConsumer.as_asgi()),
]
```

`config/asgi.py`의 `websocket_urlpatterns`에 추가:

```python
from myapp.routing import websocket_urlpatterns as myapp_ws

websocket_urlpatterns = [
    *myapp_ws,
]
```

### SSE

```python
# myapp/consumers.py
import asyncio
from common.consumers import SseConsumer

class NotificationSseConsumer(SseConsumer):
    async def stream(self):
        await self.send_event({"type": "connected"})
        while not self.disconnected:
            # 채널 레이어에서 메시지 수신 또는 DB 폴링
            await asyncio.sleep(1)
```

`config/urls.py`에 HTTP consumer 등록:

```python
from django.urls import re_path
from myapp.consumers import NotificationSseConsumer

urlpatterns += [
    re_path(r"^sse/notifications/$", NotificationSseConsumer.as_asgi()),
]
```
