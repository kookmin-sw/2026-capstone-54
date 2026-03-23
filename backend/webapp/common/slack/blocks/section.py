"""
Slack Block Kit — Section 블록 모음.
https://docs.slack.dev/reference/block-kit/blocks/section-block
"""

from __future__ import annotations

from .base import BaseBlock


class FieldsSection(BaseBlock):
  """key-value 쌍을 2열로 나열하는 section 블록.

    Args:
        fields: {"레이블": "값", ...} 형태의 딕셔너리
    """

  def __init__(self, fields: dict[str, str]) -> None:
    self.fields = fields

  def build(self) -> dict:
    return {
      "type": "section",
      "fields": [{
        "type": "mrkdwn",
        "text": f"*{k}*\n{v}"
      } for k, v in self.fields.items()],
    }


class TextSection(BaseBlock):
  """단일 mrkdwn 텍스트 section 블록."""

  def __init__(self, text: str) -> None:
    self.text = text

  def build(self) -> dict:
    return {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": self.text
      },
    }


class CodeBlock(BaseBlock):
  """코드/스택트레이스를 코드 펜스(```) 로 감싼 section 블록.

    Slack section text 의 한도는 3000자이므로, 긴 코드는 split_code_blocks() 로
    분할한 뒤 여러 CodeBlock 으로 나눠 전송하는 것을 권장한다.
    """

  def __init__(self, code: str) -> None:
    self.code = code

  def build(self) -> dict:
    return TextSection(f"```{self.code}```").build()


# Slack section text 한도 (``` 6자 포함 여유분 포함)
_CODE_CHUNK_SIZE = 2900


def split_code_blocks(code: str) -> list[CodeBlock]:
  """긴 코드를 Slack 한도에 맞게 여러 CodeBlock 으로 분할한다.

    Args:
        code: 분할할 코드/스택트레이스 문자열

    Returns:
        CodeBlock 리스트 (짧으면 1개, 길면 여러 개)
    """
  if not code:
    return []
  return [CodeBlock(code[i:i + _CODE_CHUNK_SIZE]) for i in range(0, len(code), _CODE_CHUNK_SIZE)]
