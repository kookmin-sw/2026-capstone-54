"""
Slack 메시지 비동기 전송 베이스 태스크.

서브클래스는 build_channel() 과 build_messages() 만 구현한다.
전송 실행은 SlackSender 가 담당하므로 태스크에서 client/channel 을 직접 다루지 않는다.

단일 메시지::

  def build_messages(self, **kwargs) -> list[SlackMessage]:
      return [SlackMessage(text="...", blocks=[...])]

스레드 답글 포함::

  def build_messages(self, **kwargs) -> list[SlackMessage]:
      return [
          SlackMessage(text="메인", blocks=[...]),
          SlackMessage(text="상세", blocks=[...], thread_reply=True),
      ]
"""

from __future__ import annotations

from abc import abstractmethod

import structlog
from common.slack.sender import SlackMessage, SlackSender  # noqa: F401 — re-export for subclasses

from .base_task import BaseTask

logger = structlog.get_logger(__name__)


class SendSlackMessageTask(BaseTask):
  """Slack 메시지 비동기 전송 추상 베이스 태스크."""

  abstract = True
  max_retries = 3
  default_retry_delay = 5  # seconds

  @abstractmethod
  def build_channel(self) -> str:
    """전송할 Slack 채널 ID 를 반환한다."""
    raise NotImplementedError

  @abstractmethod
  def build_messages(self, **kwargs) -> list[SlackMessage]:
    """전송할 SlackMessage 목록을 반환한다.

        thread_reply=True 인 항목은 직전 메시지의 스레드 답글로 전송된다.
        """
    raise NotImplementedError

  def run(self, *args, **kwargs) -> None:
    try:
      SlackSender(self.build_channel()).send_all(self.build_messages(**kwargs))
    except Exception as exc:
      logger.warning("slack_task_failed", task=self.name, exc=str(exc))
      raise self.retry(exc=exc)
