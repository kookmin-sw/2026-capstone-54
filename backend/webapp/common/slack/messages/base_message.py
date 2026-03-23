"""
Slack 메시지 빌더 추상 베이스 클래스.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from common.slack.blocks.base import BaseBlock
from common.slack.sender import SlackMessage


class BaseSlackMessage(ABC):
  """Slack 메시지 빌더 베이스.

    build_blocks() 를 구현하여 Slack Block Kit 블록 리스트를 반환한다.
    build_text() 는 알림 미리보기(fallback) 텍스트로 사용된다.
    """

  @abstractmethod
  def build_blocks(self) -> list[BaseBlock]:
    """메인 메시지 Block Kit 블록 리스트를 반환한다."""
    raise NotImplementedError

  @abstractmethod
  def build_text(self) -> str:
    """알림 미리보기 텍스트를 반환한다."""
    raise NotImplementedError

  def render_blocks(self) -> list[dict]:
    """build_blocks() 결과를 dict 리스트로 직렬화한다."""
    return [block.build() for block in self.build_blocks()]

  def to_main_message(self) -> SlackMessage:
    """메인 SlackMessage 를 반환한다."""
    return SlackMessage(text=self.build_text(), blocks=self.render_blocks())

  @staticmethod
  def blocks_to_thread_messages(
    blocks: list[BaseBlock],
    header_text: str,
  ) -> list[SlackMessage]:
    """블록 리스트를 스레드 SlackMessage 목록으로 변환한다.

        첫 번째 블록(헤더 레이블)과 두 번째 블록(첫 청크)을 하나의 메시지로 묶고,
        나머지 청크는 각각 별도 스레드 메시지로 분리한다.

        Args:
            blocks:      build_*_blocks() 가 반환한 BaseBlock 리스트
            header_text: 스레드 메시지의 fallback text
        """
    if not blocks:
      return []

    first_msg = SlackMessage(
      text=header_text,
      blocks=[b.build() for b in blocks[:2]],
      thread_reply=True,
    )
    continued = [
      SlackMessage(
        text=f"{header_text} (continued)",
        blocks=[b.build()],
        thread_reply=True,
      ) for b in blocks[2:]
    ]
    return [first_msg, *continued]
