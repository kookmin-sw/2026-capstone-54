"""
Slack Block Kit 블록 빌드 결과 테스트.

실제 Slack API 호출 없이 각 블록의 build() 출력 구조만 검증한다.
"""

from common.slack.blocks import (
  ActionsBlock,
  ButtonElement,
  CodeBlock,
  ContextBlock,
  DividerBlock,
  FieldsSection,
  HeaderBlock,
  ImageBlock,
  MarkdownBlock,
  RichTextBulletList,
  RichTextOrderedList,
  RichTextPreformatted,
  RichTextQuote,
  RichTextSection,
  TextSection,
  split_code_blocks,
)
from django.test import TestCase


class HeaderBlockTest(TestCase):
  """HeaderBlock 빌드 테스트"""

  def test_build_returns_header_type(self):
    """HeaderBlock.build()가 type=header인 dict를 반환한다."""
    block = HeaderBlock("제목")
    result = block.build()
    self.assertEqual(result["type"], "header")
    self.assertEqual(result["text"]["text"], "제목")
    self.assertEqual(result["text"]["type"], "plain_text")


class DividerBlockTest(TestCase):
  """DividerBlock 빌드 테스트"""

  def test_build_returns_divider_type(self):
    """DividerBlock.build()가 type=divider인 dict를 반환한다."""
    result = DividerBlock().build()
    self.assertEqual(result["type"], "divider")


class TextSectionTest(TestCase):
  """TextSection 빌드 테스트"""

  def test_build_returns_section_with_mrkdwn(self):
    """TextSection.build()가 mrkdwn 텍스트를 포함한 section을 반환한다."""
    block = TextSection("*굵은 텍스트*")
    result = block.build()
    self.assertEqual(result["type"], "section")
    self.assertEqual(result["text"]["type"], "mrkdwn")
    self.assertEqual(result["text"]["text"], "*굵은 텍스트*")


class FieldsSectionTest(TestCase):
  """FieldsSection 빌드 테스트"""

  def test_build_returns_fields_list(self):
    """FieldsSection.build()가 fields 리스트를 포함한 section을 반환한다."""
    block = FieldsSection({"모델": "`User`", "필드": "`email`"})
    result = block.build()
    self.assertEqual(result["type"], "section")
    self.assertEqual(len(result["fields"]), 2)
    self.assertIn("*모델*", result["fields"][0]["text"])
    self.assertIn("`User`", result["fields"][0]["text"])

  def test_empty_fields(self):
    """빈 dict로 생성하면 fields가 빈 리스트다."""
    result = FieldsSection({}).build()
    self.assertEqual(result["fields"], [])


class CodeBlockTest(TestCase):
  """CodeBlock 빌드 테스트"""

  def test_build_wraps_code_in_backticks(self):
    """CodeBlock.build()가 코드를 ``` 로 감싼 mrkdwn section을 반환한다."""
    block = CodeBlock("print('hello')")
    result = block.build()
    self.assertEqual(result["type"], "section")
    self.assertIn("```", result["text"]["text"])
    self.assertIn("print('hello')", result["text"]["text"])


class SplitCodeBlocksTest(TestCase):
  """split_code_blocks 분할 테스트"""

  def test_empty_string_returns_empty_list(self):
    """빈 문자열이면 빈 리스트를 반환한다."""
    self.assertEqual(split_code_blocks(""), [])

  def test_short_code_returns_single_block(self):
    """2900자 이하 코드는 CodeBlock 1개를 반환한다."""
    blocks = split_code_blocks("short code")
    self.assertEqual(len(blocks), 1)
    self.assertIsInstance(blocks[0], CodeBlock)

  def test_long_code_splits_into_multiple_blocks(self):
    """2900자 초과 코드는 여러 CodeBlock으로 분할된다."""
    long_code = "x" * 6000
    blocks = split_code_blocks(long_code)
    self.assertGreater(len(blocks), 1)
    # 각 청크가 2900자 이하인지 확인
    for block in blocks:
      self.assertLessEqual(len(block.code), 2900)

  def test_split_preserves_all_content(self):
    """분할 후 모든 청크를 합치면 원본과 동일하다."""
    original = "a" * 7500
    blocks = split_code_blocks(original)
    reconstructed = "".join(b.code for b in blocks)
    self.assertEqual(reconstructed, original)


class ContextBlockTest(TestCase):
  """ContextBlock 빌드 테스트"""

  def test_build_returns_context_type(self):
    """ContextBlock.build()가 type=context인 dict를 반환한다."""
    block = ContextBlock("👤 개발자: *홍길동*")
    result = block.build()
    self.assertEqual(result["type"], "context")
    self.assertEqual(result["elements"][0]["type"], "mrkdwn")
    self.assertIn("홍길동", result["elements"][0]["text"])


class ImageBlockTest(TestCase):
  """ImageBlock 빌드 테스트"""

  def test_build_returns_image_type(self):
    """ImageBlock.build()가 type=image인 dict를 반환한다."""
    block = ImageBlock(image_url="https://example.com/img.png", alt_text="예시 이미지")
    result = block.build()
    self.assertEqual(result["type"], "image")
    self.assertEqual(result["image_url"], "https://example.com/img.png")
    self.assertEqual(result["alt_text"], "예시 이미지")


class ActionsBlockTest(TestCase):
  """ActionsBlock 빌드 테스트"""

  def test_build_returns_actions_with_buttons(self):
    """ActionsBlock.build()가 type=actions와 버튼 elements를 반환한다."""
    btn = ButtonElement(text="확인", action_id="confirm", value="yes")
    block = ActionsBlock(elements=[btn])
    result = block.build()
    self.assertEqual(result["type"], "actions")
    self.assertEqual(len(result["elements"]), 1)
    self.assertEqual(result["elements"][0]["type"], "button")
    self.assertEqual(result["elements"][0]["text"]["text"], "확인")


class RichTextSectionTest(TestCase):
  """RichTextSection 빌드 테스트"""

  def test_build_returns_rich_text_type(self):
    """RichTextSection.build()가 최상위 type=rich_text인 dict를 반환한다."""
    block = RichTextSection(text="안녕하세요")
    result = block.build()
    self.assertEqual(result["type"], "rich_text")
    # 내부 elements[0]이 rich_text_section이어야 한다
    self.assertEqual(result["elements"][0]["type"], "rich_text_section")
    self.assertEqual(result["elements"][0]["elements"][0]["text"], "안녕하세요")


class RichTextBulletListTest(TestCase):
  """RichTextBulletList 빌드 테스트"""

  def test_build_returns_rich_text_with_bullet_list(self):
    """RichTextBulletList.build()가 rich_text 안에 rich_text_list(bullet)를 반환한다."""
    block = RichTextBulletList(items=["항목1", "항목2"])
    result = block.build()
    self.assertEqual(result["type"], "rich_text")
    list_el = result["elements"][0]
    self.assertEqual(list_el["type"], "rich_text_list")
    self.assertEqual(list_el["style"], "bullet")
    self.assertEqual(len(list_el["elements"]), 2)


class RichTextOrderedListTest(TestCase):
  """RichTextOrderedList 빌드 테스트"""

  def test_build_returns_rich_text_with_ordered_list(self):
    """RichTextOrderedList.build()가 rich_text 안에 rich_text_list(ordered)를 반환한다."""
    block = RichTextOrderedList(items=["첫째", "둘째"])
    result = block.build()
    self.assertEqual(result["type"], "rich_text")
    list_el = result["elements"][0]
    self.assertEqual(list_el["type"], "rich_text_list")
    self.assertEqual(list_el["style"], "ordered")


class RichTextPreformattedTest(TestCase):
  """RichTextPreformatted 빌드 테스트"""

  def test_build_returns_rich_text_with_preformatted(self):
    """RichTextPreformatted.build()가 rich_text 안에 rich_text_preformatted를 반환한다."""
    block = RichTextPreformatted(code="print('hello')")
    result = block.build()
    self.assertEqual(result["type"], "rich_text")
    self.assertEqual(result["elements"][0]["type"], "rich_text_preformatted")


class RichTextQuoteTest(TestCase):
  """RichTextQuote 빌드 테스트"""

  def test_build_returns_rich_text_with_quote(self):
    """RichTextQuote.build()가 rich_text 안에 rich_text_quote를 반환한다."""
    block = RichTextQuote(text="인용문")
    result = block.build()
    self.assertEqual(result["type"], "rich_text")
    self.assertEqual(result["elements"][0]["type"], "rich_text_quote")


class MarkdownBlockTest(TestCase):
  """MarkdownBlock 빌드 테스트"""

  def test_build_returns_markdown_type(self):
    """MarkdownBlock.build()가 type=markdown인 dict를 반환한다."""
    block = MarkdownBlock("## 제목\n내용")
    result = block.build()
    self.assertEqual(result["type"], "markdown")
    self.assertIn("## 제목", result["text"])
