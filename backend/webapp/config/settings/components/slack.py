"""
Slack 알림 설정

환경변수:
  SLACK_BOT_TOKEN      - Slack Bot OAuth Token (xoxb-...)
  SLACK_CHANNEL_ERROR  - 서버 에러(5xx) 알림 채널 ID
  SLACK_CHANNEL_EVENT  - 사용자 이벤트(회원가입 등) 알림 채널 ID
  SLACK_CHANNEL_NPLUSONE - N+1 쿼리 감지 알림 채널 ID

채널 ID는 Slack 채널 URL 또는 채널 상세 정보에서 확인할 수 있습니다.
(예: https://app.slack.com/client/T0000/C0000000 → C0000000)
"""

import environ

env = environ.Env()

SLACK_BOT_TOKEN: str = env.str("SLACK_BOT_TOKEN", default="")
SLACK_CHANNEL_ERROR: str = env.str("SLACK_CHANNEL_ERROR", default="")
SLACK_CHANNEL_EVENT: str = env.str("SLACK_CHANNEL_EVENT", default="")
SLACK_CHANNEL_NPLUSONE: str = env.str("SLACK_CHANNEL_NPLUSONE", default="")

__all__ = [
  "SLACK_BOT_TOKEN",
  "SLACK_CHANNEL_ERROR",
  "SLACK_CHANNEL_EVENT",
  "SLACK_CHANNEL_NPLUSONE",
]
