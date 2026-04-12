---
inclusion: fileMatch
fileMatchPattern: "**/consumers.py"
---

# WebSocket / SSE Consumer 작성 가이드

## 베이스 클래스

| 프로토콜 | 인증 | 베이스 클래스 |
|---|---|---|
| WebSocket | 티켓 기반 | `UserWebSocketConsumer` |
| WebSocket | 없음 | `BaseWebSocketConsumer` |
| SSE | JWT Bearer | `UserSseConsumer` |
| SSE | 없음 | `SseConsumer` |

## WebSocket 필수 패턴

- `handle_connect()`: 그룹 참가, 초기화
- `handle_disconnect()`: 그룹 탈퇴, 정리
- `handle_message()`: 클라이언트 메시지 처리
- `self.reply()`: JSON 응답 전송

## SSE 필수 패턴

- `stream()`: 이벤트 스트림 구현
- `self.send_event(data, event="이벤트명")`: 이벤트 전송
- `self.disconnected`: 연결 종료 여부 확인
- `@sse_consumer` 데코레이터로 문서화

## 외부 push 패턴

```python
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

async_to_sync(get_channel_layer().group_send)(
  f"user_{user_id}",
  {"type": "user.message", "payload": {...}},  # WS
  # {"type": "sse.push", "payload": {...}},     # SSE
)
```

## routing.py 등록 후 config/asgi.py에 반드시 추가
