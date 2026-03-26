"""
사용자 이벤트(회원가입 등) Slack 메시지 빌더.
"""

from __future__ import annotations

from common.slack.blocks import FieldsSection, HeaderBlock, TextSection
from common.slack.blocks.base import BaseBlock

from .base_message import BaseSlackMessage


class EventSlackMessage(BaseSlackMessage):
  """사용자 이벤트 발생 시 Slack 에 전송할 메시지를 빌드한다."""

  def __init__(
    self,
    event_name: str,
    description: str = "",
    fields: dict[str, str] | None = None,
  ) -> None:
    self.event_name = event_name
    self.description = description
    self.fields = fields or {}

  def build_text(self) -> str:
    return f"📌 이벤트: {self.event_name}"

  def build_blocks(self) -> list[BaseBlock]:
    blocks: list[BaseBlock] = [HeaderBlock(f"📌 {self.event_name}")]

    if self.description:
      blocks.append(TextSection(self.description))

    if self.fields:
      # Slack section 은 최대 10개 fields — 초과 시 분할
      items = list(self.fields.items())
      for i in range(0, len(items), 10):
        blocks.append(FieldsSection(dict(items[i:i + 10])))

    return blocks
