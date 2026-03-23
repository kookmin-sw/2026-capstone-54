"""
N+1 쿼리 감지 Slack 메시지 빌더.
"""

from __future__ import annotations

from common.slack.blocks import ContextBlock, FieldsSection, HeaderBlock, TextSection, split_code_blocks
from common.slack.blocks.base import BaseBlock

from .base_message import BaseSlackMessage


class NPlusOneSlackMessage(BaseSlackMessage):
  """N+1 쿼리 감지 시 Slack 에 전송할 메시지를 빌드한다."""

  def __init__(
    self,
    model: str,
    field: str,
    path: str = "",
    method: str = "",
    stacktrace: str = "",
    sql_log: str = "",
    developer: str = "",
  ) -> None:
    self.model = model
    self.field = field
    self.path = path
    self.method = method
    self.stacktrace = stacktrace
    self.sql_log = sql_log
    self.developer = developer

  def build_text(self) -> str:
    return f"⚠️ N+1 쿼리 감지: {self.model}.{self.field}"

  def build_blocks(self) -> list[BaseBlock]:
    blocks: list[BaseBlock] = [
      HeaderBlock("⚠️ N+1 쿼리 감지"),
      FieldsSection({
        "모델": f"`{self.model}`",
        "필드": f"`{self.field}`",
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

  def build_stacktrace_blocks(self) -> list[BaseBlock]:
    """스레드 답글용 stacktrace + SQL 블록을 반환한다.

        stacktrace 가 길면 2900자 단위로 분할하여 여러 CodeBlock 으로 반환한다.
        sql_log 가 있으면 stacktrace 뒤에 이어서 추가한다.
        """
    blocks: list[BaseBlock] = []

    if self.stacktrace:
      blocks.append(TextSection("*Stacktrace*"))
      blocks.extend(split_code_blocks(self.stacktrace))

    if self.sql_log:
      blocks.append(TextSection("*SQL Queries*"))
      blocks.extend(split_code_blocks(self.sql_log))

    return blocks
