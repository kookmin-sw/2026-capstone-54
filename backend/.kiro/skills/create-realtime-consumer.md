# WebSocket / SSE Consumer 생성 Skill

Django Channels 기반 실시간 Consumer를 프로젝트 규칙에 맞게 생성합니다.

## 절차

### 1단계: Consumer 유형 결정

| 프로토콜 | 인증 | 베이스 클래스 |
|---|---|---|
| WebSocket | 티켓 기반 | `UserWebSocketConsumer` |
| WebSocket | 없음 | `BaseWebSocketConsumer` |
| SSE | JWT Bearer | `UserSseConsumer` |
| SSE | 없음 | `SseConsumer` |

### 2단계: Consumer 파일 생성

위치: `webapp/api/v1/{앱명}/consumers.py`

WebSocket 예시:
```python
from common.consumers.websocket import UserWebSocketConsumer

class XxxConsumer(UserWebSocketConsumer):
  async def handle_connect(self) -> None:
    # 그룹 참가, 초기화 로직
    pass

  async def handle_message(self, data: dict) -> None:
    await self.reply({"received": data})
```

SSE 예시 (문서화 데코레이터 포함):
```python
from common.consumers.sse import UserSseConsumer
from realtime_docs.decorators import sse_consumer

@sse_consumer(
  path="/sse/{앱명}/{리소스}/",
  title="SSE 제목",
  description="SSE 설명",
  tags=["{앱명}"],
  events=[{"name": "status", "schema": {...}}],
)
class XxxSseConsumer(UserSseConsumer):
  async def stream(self) -> None:
    await self.send_event({"status": "connected"}, event="connected")
```

### 3단계: Routing 파일 생성

위치: `webapp/api/v1/{앱명}/routing.py`

```python
from django.urls import path
from .consumers import XxxConsumer, XxxSseConsumer

sse_urlpatterns = [
  path("sse/{앱명}/{리소스}/", XxxSseConsumer.as_asgi()),
]

websocket_urlpatterns = [
  path("ws/{앱명}/{리소스}/", XxxConsumer.as_asgi()),
]
```

### 4단계: ASGI 등록

`webapp/config/asgi.py`에 routing import 추가:
- `sse_urlpatterns`에 SSE 패턴 추가
- `websocket_urlpatterns`에 WebSocket 패턴 추가

## 참조

#[[file:docs/ai-code-generation-guidelines.md]]
