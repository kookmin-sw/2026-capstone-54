"""
Slack Block Kit — Image 블록.
https://docs.slack.dev/reference/block-kit/blocks/image-block
"""

from __future__ import annotations

from .base import BaseBlock
from .section import TextSection


class ImageBlock(BaseBlock):
  """독립 이미지 블록.

    이미지만 단독으로 표시할 때 사용한다.

    Args:
        image_url: 이미지 URL
        alt_text:  스크린리더 / 이미지 로드 실패 시 대체 텍스트 (필수)
        title:     이미지 상단에 표시할 plain_text 제목 (선택)
    """

  def __init__(self, image_url: str, alt_text: str, title: str = "") -> None:
    self.image_url = image_url
    self.alt_text = alt_text
    self.title = title

  def build(self) -> dict:
    block: dict = {
      "type": "image",
      "image_url": self.image_url,
      "alt_text": self.alt_text,
    }
    if self.title:
      block["title"] = {"type": "plain_text", "text": self.title, "emoji": True}
    return block


class ImageAccessorySection(BaseBlock):
  """텍스트 오른쪽에 썸네일 이미지를 붙인 section 블록.

    Args:
        text:      mrkdwn 본문 텍스트
        image_url: 썸네일 이미지 URL
        alt_text:  이미지 대체 텍스트
    """

  def __init__(self, text: str, image_url: str, alt_text: str) -> None:
    self.text = text
    self.image_url = image_url
    self.alt_text = alt_text

  def build(self) -> dict:
    block = TextSection(self.text).build()
    block["accessory"] = {
      "type": "image",
      "image_url": self.image_url,
      "alt_text": self.alt_text,
    }
    return block
