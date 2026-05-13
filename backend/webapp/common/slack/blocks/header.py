"""
Slack Block Kit — Header 블록.
https://docs.slack.dev/reference/block-kit/blocks/header-block/
"""

from __future__ import annotations

from .base import BaseBlock


class HeaderBlock(BaseBlock):
  """plain_text 헤더 블록."""

  def __init__(self, text: str) -> None:
    self.text = text

  def build(self) -> dict:
    return {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": self.text,
        "emoji": True
      },
    }
