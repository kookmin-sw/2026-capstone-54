"""
Slack Block Kit — Markdown 블록.
https://docs.slack.dev/reference/block-kit/blocks/markdown-block

LLM 응답이나 마크다운 원문을 그대로 Slack 에 렌더링할 때 사용한다.
Slack 이 직접 파싱하므로 mrkdwn 변환 없이 표준 마크다운을 전달할 수 있다.

제한:
  - 단일 페이로드 내 모든 markdown 블록의 누적 합계는 12,000자 이하
  - block_id 는 무시됨
"""

from __future__ import annotations

from .base import BaseBlock


class MarkdownBlock(BaseBlock):
  """표준 마크다운 텍스트를 Slack 이 직접 렌더링하는 블록.

    Args:
        text: 표준 마크다운 문자열 (최대 12,000자 누적 제한)

    Example::

        MarkdownBlock("## 배포 완료\\n- 버전: `v1.2.3`\\n- 환경: **production**")
    """

  def __init__(self, text: str) -> None:
    self.text = text

  def build(self) -> dict:
    return {
      "type": "markdown",
      "text": self.text,
    }
