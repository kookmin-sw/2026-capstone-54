"""
Slack 메시지 전송 실행기.

SlackSender 는 client / channel 초기화와 실제 전송을 담당한다.
태스크는 SlackSender 를 직접 다루지 않고, build_messages() 로 메시지 목록만 반환한다.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import structlog

logger = structlog.get_logger(__name__)


@dataclass
class SlackMessage:
  """전송할 단일 Slack 메시지.

    Attributes:
        text:         알림 미리보기(fallback) 텍스트
        blocks:       Block Kit 블록 리스트
        thread_reply: True 이면 직전 메시지의 스레드 답글로 전송
    """
  text: str
  blocks: list[dict] = field(default_factory=list)
  thread_reply: bool = False


class SlackSender:
  """client / channel 을 초기화하고 SlackMessage 목록을 순서대로 전송한다."""

  def __init__(self, channel: str) -> None:
    self._channel = channel

  def send_all(self, messages: list[SlackMessage]) -> None:
    """메시지 목록을 순서대로 전송한다.

        thread_reply=True 인 메시지는 직전 메시지의 ts 를 thread_ts 로 사용한다.
        client 또는 channel 이 없으면 조용히 건너뛴다.
        """
    from common.slack.client import get_slack_client

    client = get_slack_client()
    if client is None:
      logger.debug("slack_skipped_no_token")
      return

    if not self._channel:
      logger.debug("slack_skipped_no_channel")
      return

    last_ts: str | None = None

    for msg in messages:
      kwargs: dict = {
        "channel": self._channel,
        "text": msg.text,
      }
      if msg.blocks:
        kwargs["blocks"] = msg.blocks
      if msg.thread_reply and last_ts:
        kwargs["thread_ts"] = last_ts

      response = client.chat_postMessage(**kwargs)
      if not msg.thread_reply:
        last_ts = response["ts"]

      logger.info(
        "slack_message_sent",
        channel=self._channel,
        thread_reply=msg.thread_reply,
        ts=response["ts"],
      )
