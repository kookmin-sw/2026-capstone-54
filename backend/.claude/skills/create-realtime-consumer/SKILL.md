---
name: create-realtime-consumer
description: WebSocket 또는 SSE Consumer를 생성합니다. 실시간 통신, WebSocket, SSE, 스트리밍, 실시간 알림 등의 요청 시 사용합니다. Django Channels 기반으로 UserWebSocketConsumer/UserSseConsumer를 상속하고 routing, ASGI 등록까지 처리합니다.
---

# WebSocket / SSE Consumer 생성 Skill

## 목적
MeFit 프로젝트 규칙에 맞는 실시간 Consumer를 생성한다.

## 절차

### 1. Consumer 유형 결정

| 프로토콜 | 인증 | 베이스 클래스 |
|---|---|---|
| WebSocket | 티켓 기반 | `UserWebSocketConsumer` |
| WebSocket | 없음 | `BaseWebSocketConsumer` |
| SSE | JWT Bearer | `UserSseConsumer` |
| SSE | 없음 | `SseConsumer` |

### 2. Consumer 파일 생성

위치: `webapp/api/v1/{앱명}/consumers.py`

#### WebSocket

```python
"""Consumer 설명 (한국어)."""

import structlog
from common.consumers.websocket import UserWebSocketConsumer

logger = structlog.get_logger(__name__)

class XxxConsumer(UserWebSocketConsumer):
  """Consumer 설명 (한국어)."""

  async def handle_connect(self) -> None:
    # URL kwargs 접근: self.scope["url_route"]["kwargs"]["param"]
    # 그룹 참가, 초기화 로직
    logger.info("xxx_ws_connected", user_id=self.user.pk)

  async def handle_disconnect(self, code: int) -> None:
    logger.info("xxx_ws_disconnected", user_id=self.user.pk, code=code)

  async def handle_message(self, data: dict) -> None:
    await self.reply({"received": data})
```

#### SSE (문서화 데코레이터 포함)

```python
"""Consumer 설명 (한국어)."""

import asyncio
import structlog
from common.consumers.sse import UserSseConsumer
from realtime_docs.decorators import sse_consumer

logger = structlog.get_logger(__name__)

@sse_consumer(
  path="/sse/{앱명}/{리소스}/",
  title="SSE 제목 (한국어)",
  description="SSE 설명 (한국어)",
  tags=["{앱명}"],
  events=[
    {"name": "status", "schema": {"type": "object", "properties": {...}}},
  ],
)
class XxxSseConsumer(UserSseConsumer):
  """SSE Consumer 설명 (한국어)."""

  POLL_INTERVAL = 2.0

  async def stream(self) -> None:
    await self.send_event({"status": "connected"}, event="connected")
    while not self.disconnected:
      await asyncio.sleep(self.POLL_INTERVAL)
      # 상태 변경 감지 후 이벤트 전송
```

### 3. Routing 파일

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

### 4. ASGI 등록

`webapp/config/asgi.py`에 추가:
- routing import 추가
- `sse_urlpatterns`에 spread
- `websocket_urlpatterns`에 spread

## 체크리스트
- [ ] 적절한 베이스 Consumer 상속
- [ ] structlog 로깅 포함
- [ ] routing.py 정의
- [ ] config/asgi.py에 등록
- [ ] SSE: @sse_consumer 데코레이터 적용
- [ ] WS: 티켓 인증 사용 (UserWebSocketConsumer)
