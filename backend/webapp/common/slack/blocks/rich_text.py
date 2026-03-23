"""
Slack Block Kit — Rich Text 블록.
https://docs.slack.dev/reference/block-kit/blocks/rich-text-block

mrkdwn 보다 구조적인 서식이 필요할 때 사용한다.
Slack 클라이언트의 WYSIWYG 출력 포맷이기도 하다.

구성 요소:
  RichTextBlock            — 최상위 rich_text 블록 (sub-element 목록을 감싼다)
  RichTextSection          — 인라인 텍스트 단락
  RichTextBulletList       — 글머리 기호 목록
  RichTextOrderedList      — 번호 매기기 목록
  RichTextPreformatted     — 코드 블록 (언어 지정 가능)
  RichTextQuote            — 인용 블록
"""

from __future__ import annotations

from .base import BaseBlock

# ---------------------------------------------------------------------------
# Sub-element helpers (rich_text 내부에서만 사용)
# ---------------------------------------------------------------------------


def _text_el(text: str, bold: bool = False, italic: bool = False, code: bool = False) -> dict:
  """rich_text_section 안에 들어가는 text 요소."""
  el: dict = {"type": "text", "text": text}
  style: dict = {}
  if bold:
    style["bold"] = True
  if italic:
    style["italic"] = True
  if code:
    style["code"] = True
  if style:
    el["style"] = style
  return el


def _section_el(items: list[dict]) -> dict:
  """rich_text_section sub-element."""
  return {"type": "rich_text_section", "elements": items}


# ---------------------------------------------------------------------------
# Public block classes
# ---------------------------------------------------------------------------


class RichTextSection(BaseBlock):
  """단락 텍스트 rich_text 블록.

    Args:
        text:   본문 텍스트
        bold:   굵게
        italic: 기울임
        code:   인라인 코드
    """

  def __init__(self, text: str, bold: bool = False, italic: bool = False, code: bool = False) -> None:
    self.text = text
    self.bold = bold
    self.italic = italic
    self.code = code

  def build(self) -> dict:
    return {
      "type": "rich_text",
      "elements": [_section_el([_text_el(self.text, self.bold, self.italic, self.code)])],
    }


class RichTextBulletList(BaseBlock):
  """글머리 기호(•) 목록 rich_text 블록.

    Args:
        items:  항목 문자열 목록
        indent: 들여쓰기 레벨 (중첩 목록에 사용)
    """

  def __init__(self, items: list[str], indent: int = 0) -> None:
    self.items = items
    self.indent = indent

  def build(self) -> dict:
    list_el: dict = {
      "type": "rich_text_list",
      "style": "bullet",
      "elements": [_section_el([_text_el(item)]) for item in self.items],
    }
    if self.indent:
      list_el["indent"] = self.indent
    return {
      "type": "rich_text",
      "elements": [list_el],
    }


class RichTextOrderedList(BaseBlock):
  """번호 매기기 목록 rich_text 블록.

    Args:
        items:  항목 문자열 목록
        offset: 시작 번호 오프셋 (기본 0 → 1번부터 시작)
    """

  def __init__(self, items: list[str], offset: int = 0) -> None:
    self.items = items
    self.offset = offset

  def build(self) -> dict:
    list_el: dict = {
      "type": "rich_text_list",
      "style": "ordered",
      "elements": [_section_el([_text_el(item)]) for item in self.items],
    }
    if self.offset:
      list_el["offset"] = self.offset
    return {
      "type": "rich_text",
      "elements": [list_el],
    }


class RichTextPreformatted(BaseBlock):
  """코드 블록 rich_text 블록 (언어 지정으로 구문 강조 가능).

    Args:
        code:     코드 문자열
        language: 구문 강조 언어 (예: "python", "json", "bash")
    """

  def __init__(self, code: str, language: str = "") -> None:
    self.code = code
    self.language = language

  def build(self) -> dict:
    pre_el: dict = {
      "type": "rich_text_preformatted",
      "elements": [_text_el(self.code)],
    }
    if self.language:
      pre_el["language"] = self.language
    return {
      "type": "rich_text",
      "elements": [pre_el],
    }


class RichTextQuote(BaseBlock):
  """인용 블록 rich_text 블록.

    Args:
        text: 인용할 텍스트
    """

  def __init__(self, text: str) -> None:
    self.text = text

  def build(self) -> dict:
    return {
      "type": "rich_text",
      "elements": [{
        "type": "rich_text_quote",
        "elements": [_text_el(self.text)],
      }],
    }
