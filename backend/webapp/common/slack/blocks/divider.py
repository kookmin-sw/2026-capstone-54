"""
Slack Block Kit — Divider 블록.
https://docs.slack.dev/reference/block-kit/blocks/divider-block/
"""

from __future__ import annotations

from .base import BaseBlock


class DividerBlock(BaseBlock):
  """구분선 블록."""

  def build(self) -> dict:
    return {"type": "divider"}
