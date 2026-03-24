"""
Slack WebClient 팩토리.

호출마다 새 WebClient 인스턴스를 반환한다.
토큰이 비어 있으면 None 을 반환하여 Slack 미설정 환경에서도 안전하게 동작한다.
"""

from __future__ import annotations

from django.conf import settings
from slack_sdk import WebClient


def get_slack_client() -> WebClient | None:
  """Slack WebClient 를 반환한다.

    SLACK_BOT_TOKEN 이 설정되지 않은 경우 None 을 반환한다.
    WebClient 는 thread-safe 하므로 호출마다 새 인스턴스를 생성해도 무방하다.
    """
  token: str = getattr(settings, "SLACK_BOT_TOKEN", "")
  if not token:
    return None
  return WebClient(token=token)
