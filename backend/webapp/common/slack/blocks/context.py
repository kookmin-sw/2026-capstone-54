"""
Slack Block Kit — Context 블록.
https://docs.slack.dev/reference/block-kit/blocks/context-block/
"""

from __future__ import annotations

from .base import BaseBlock


class ContextBlock(BaseBlock):
  """하단 컨텍스트(소형 텍스트) 블록.

    Args:
        texts: mrkdwn 문자열 목록
    """

  def __init__(self, *texts: str) -> None:
    self.texts = texts

  def build(self) -> dict:
    return {
      "type": "context",
      "elements": [{
        "type": "mrkdwn",
        "text": t
      } for t in self.texts],
    }
