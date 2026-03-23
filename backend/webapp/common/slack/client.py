"""
Slack WebClient 싱글톤 래퍼.

설정된 SLACK_BOT_TOKEN 으로 WebClient 인스턴스를 한 번만 생성한다.
토큰이 비어 있으면 None 을 반환하여 Slack 미설정 환경에서도 안전하게 동작한다.
"""

from __future__ import annotations

import structlog
from django.conf import settings
from slack_sdk import WebClient

logger = structlog.get_logger(__name__)

_client: WebClient | None = None


def get_slack_client() -> WebClient | None:
  """Slack WebClient 싱글톤을 반환한다.

    SLACK_BOT_TOKEN 이 설정되지 않은 경우 None 을 반환한다.
    """
  global _client

  token: str = getattr(settings, "SLACK_BOT_TOKEN", "")
  if not token:
    return None

  if _client is None:
    _client = WebClient(token=token)
    logger.debug("slack_client_initialized")

  return _client
