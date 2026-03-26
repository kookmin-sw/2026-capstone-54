# Slack 알림 설정 가이드

## 개요

서버 에러(5xx), 사용자 이벤트(회원가입), N+1 쿼리 감지 시 Slack 채널에 비동기 알림을 전송합니다.

## Slack App 생성

1. [Slack API](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. App Name 입력 후 워크스페이스 선택
3. **OAuth & Permissions** → **Bot Token Scopes** 에 아래 권한 추가:
   - `chat:write`
   - `chat:write.public` (채널에 봇을 초대하지 않고 메시지 전송 시)
4. **Install to Workspace** → Bot User OAuth Token 복사 (`xoxb-...`)

## 채널 ID 확인

Slack 채널 우클릭 → **채널 세부 정보 보기** → 하단에 채널 ID 표시 (예: `C0000000000`)

## 환경변수 설정

`.env` 파일에 아래 값을 추가합니다:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL_ERROR=C0000000000      # 서버 에러 알림 채널
SLACK_CHANNEL_EVENT=C0000000001      # 사용자 이벤트 알림 채널
SLACK_CHANNEL_NPLUSONE=C0000000002   # N+1 쿼리 감지 알림 채널
```

## 알림 종류

| 알림 | 채널 설정 | 트리거 |
|------|-----------|--------|
| 서버 에러 (5xx) | `SLACK_CHANNEL_ERROR` | DRF 예외 핸들러에서 처리되지 않은 예외 |
| 회원가입 이벤트 | `SLACK_CHANNEL_EVENT` | `SignUpService.execute()` |
| N+1 쿼리 감지 | `SLACK_CHANNEL_NPLUSONE` | nplusone 미들웨어 (개발 환경 전용) |

## N+1 쿼리 감지 (nplusone)

nplusone 은 **개발 환경 전용**으로 `development.py` 에서만 활성화됩니다.

감지 시 콘솔 로그와 함께 `SLACK_CHANNEL_NPLUSONE` 채널에 알림이 전송됩니다.

```
⚠️ N+1 쿼리 감지: MyModel.related_field
```

특정 모델/필드를 무시하려면 `development.py` 에 추가:

```python
NPLUSONE_WHITELIST = [
    {"model": "myapp.MyModel", "field": "related_field"},
]
```

## 커스텀 이벤트 알림 추가

```python
from django.conf import settings
from common.slack.messages.event_message import EventSlackMessage
from common.tasks.send_slack_message_task import RegisteredSendSlackMessageTask

msg = EventSlackMessage(
    event_name="결제 완료",
    fields={"사용자": user.email, "금액": "10,000원"},
)
RegisteredSendSlackMessageTask.delay(
    channel=settings.SLACK_CHANNEL_EVENT,
    text=msg.build_text(),
    blocks=msg.build_blocks(),
)
```

## 주의사항

- `SLACK_BOT_TOKEN` 이 비어 있으면 Slack 전송을 건너뜁니다 (에러 없음).
- 메시지 전송은 Celery 워커에서 비동기로 처리되므로 API 응답 속도에 영향을 주지 않습니다.
- Slack API 오류 시 최대 3회 재시도합니다.
