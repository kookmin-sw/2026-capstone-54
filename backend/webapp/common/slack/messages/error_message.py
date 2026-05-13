"""
서버 에러(5xx) Slack 메시지 빌더.

메인 메시지: 에러 요약
스레드 답글: 전체 traceback
"""

from __future__ import annotations

from common.slack.blocks import ContextBlock, FieldsSection, HeaderBlock, TextSection, split_code_blocks
from common.slack.blocks.base import BaseBlock

from .base_message import BaseSlackMessage


class ErrorSlackMessage(BaseSlackMessage):
  """5xx 에러 발생 시 Slack 에 전송할 메시지를 빌드한다."""

  def __init__(
    self,
    error_type: str,
    error_message: str,
    path: str = "",
    method: str = "",
    traceback: str = "",
    developer: str = "",
  ) -> None:
    self.error_type = error_type
    self.error_message = error_message
    self.path = path
    self.method = method
    self.traceback = traceback
    self.developer = developer

  def build_text(self) -> str:
    return f"🚨 서버 에러 발생: {self.error_type}"

  def build_blocks(self) -> list[BaseBlock]:
    blocks: list[BaseBlock] = [
      HeaderBlock("🚨 서버 에러 발생"),
      FieldsSection({
        "에러 유형": f"`{self.error_type}`",
        "메시지": self.error_message,
      }),
    ]

    if self.path or self.method:
      blocks.append(FieldsSection({
        "메서드": f"`{self.method}`",
        "경로": f"`{self.path}`",
      }))

    if self.developer:
      blocks.append(ContextBlock(f"👤 개발자: *{self.developer}*"))

    return blocks

  def build_traceback_blocks(self) -> list[BaseBlock]:
    """스레드 답글용 traceback 블록을 반환한다.

        traceback 이 길면 2900자 단위로 분할하여 여러 CodeBlock 으로 반환한다.
        """
    if not self.traceback:
      return []
    return [TextSection("*Traceback*"), *split_code_blocks(self.traceback)]
