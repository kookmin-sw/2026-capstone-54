"""
Slack 메시지 빌더 테스트.

ErrorSlackMessage / NPlusOneSlackMessage 의 블록 구성과
BaseSlackMessage.blocks_to_thread_messages() 분할 로직을 검증한다.
"""

from common.slack.blocks.section import CodeBlock, TextSection
from common.slack.messages.base_message import BaseSlackMessage
from common.slack.messages.error_message import ErrorSlackMessage
from common.slack.messages.nplusone_message import NPlusOneSlackMessage
from common.slack.sender import SlackMessage
from django.test import TestCase


class BlocksToThreadMessagesTest(TestCase):
  """BaseSlackMessage.blocks_to_thread_messages() 테스트"""

  def test_empty_blocks_returns_empty_list(self):
    """블록이 없으면 빈 리스트를 반환한다."""
    result = BaseSlackMessage.blocks_to_thread_messages([], "헤더")
    self.assertEqual(result, [])

  def test_single_block_returns_one_message(self):
    """블록 1개면 스레드 메시지 1개를 반환한다."""
    blocks = [TextSection("헤더")]
    result = BaseSlackMessage.blocks_to_thread_messages(blocks, "헤더")
    self.assertEqual(len(result), 1)
    self.assertTrue(result[0].thread_reply)

  def test_two_blocks_bundled_into_one_message(self):
    """블록 2개(헤더 + 첫 청크)는 메시지 1개로 묶인다."""
    blocks = [TextSection("*Stacktrace*"), CodeBlock("traceback line")]
    result = BaseSlackMessage.blocks_to_thread_messages(blocks, "Stacktrace")
    self.assertEqual(len(result), 1)
    self.assertEqual(len(result[0].blocks), 2)

  def test_many_blocks_split_into_multiple_messages(self):
    """블록 3개 이상이면 첫 2개는 하나로 묶이고 나머지는 각각 별도 메시지가 된다."""
    blocks = [TextSection("헤더"), CodeBlock("청크1"), CodeBlock("청크2"), CodeBlock("청크3")]
    result = BaseSlackMessage.blocks_to_thread_messages(blocks, "헤더")
    self.assertEqual(len(result), 3)  # [헤더+청크1], [청크2], [청크3]
    self.assertEqual(len(result[0].blocks), 2)
    self.assertEqual(len(result[1].blocks), 1)
    self.assertTrue(all(m.thread_reply for m in result))

  def test_continued_messages_have_continued_text(self):
    """두 번째 이후 메시지의 text에 '(continued)'가 포함된다."""
    blocks = [TextSection("헤더"), CodeBlock("청크1"), CodeBlock("청크2")]
    result = BaseSlackMessage.blocks_to_thread_messages(blocks, "Traceback")
    self.assertNotIn("continued", result[0].text)
    self.assertIn("continued", result[1].text)


class ErrorSlackMessageTest(TestCase):
  """ErrorSlackMessage 빌드 테스트"""

  def _make(self, **kwargs):
    defaults = dict(
      error_type="ValueError",
      error_message="잘못된 값입니다.",
      path="/api/v1/users/",
      method="POST",
      traceback="Traceback (most recent call last):\n  ...",
      developer="홍길동",
    )
    return ErrorSlackMessage(**{**defaults, **kwargs})

  def test_build_text_contains_error_type(self):
    """build_text()에 에러 유형이 포함된다."""
    msg = self._make()
    self.assertIn("ValueError", msg.build_text())

  def test_build_blocks_contains_header_and_fields(self):
    """build_blocks()가 HeaderBlock과 FieldsSection을 포함한다."""
    msg = self._make()
    blocks = msg.build_blocks()
    built = [b.build() for b in blocks]
    types = [b["type"] for b in built]
    self.assertIn("header", types)
    self.assertIn("section", types)

  def test_build_blocks_includes_path_method_when_provided(self):
    """path/method가 있으면 해당 FieldsSection이 포함된다."""
    msg = self._make(path="/api/test/", method="GET")
    built = [b.build() for b in msg.build_blocks()]
    all_text = str(built)
    self.assertIn("/api/test/", all_text)
    self.assertIn("GET", all_text)

  def test_build_blocks_excludes_path_when_empty(self):
    """path/method가 없으면 해당 FieldsSection이 포함되지 않는다."""
    msg = self._make(path="", method="")
    built = [b.build() for b in msg.build_blocks()]
    # fields section이 2개(에러 요약 + 개발자 context)만 있어야 함
    self.assertEqual(len(built), 3)  # header + error fields + developer context

  def test_build_traceback_blocks_empty_when_no_traceback(self):
    """traceback이 없으면 빈 리스트를 반환한다."""
    msg = self._make(traceback="")
    self.assertEqual(msg.build_traceback_blocks(), [])

  def test_build_traceback_blocks_returns_text_and_code(self):
    """traceback이 있으면 TextSection + CodeBlock 리스트를 반환한다."""
    msg = self._make(traceback="line1\nline2")
    blocks = msg.build_traceback_blocks()
    self.assertGreaterEqual(len(blocks), 2)
    self.assertIsInstance(blocks[0], TextSection)
    self.assertIsInstance(blocks[1], CodeBlock)

  def test_to_main_message_returns_slack_message(self):
    """to_main_message()가 SlackMessage 인스턴스를 반환한다."""
    msg = self._make()
    result = msg.to_main_message()
    self.assertIsInstance(result, SlackMessage)
    self.assertFalse(result.thread_reply)


class NPlusOneSlackMessageTest(TestCase):
  """NPlusOneSlackMessage 빌드 테스트"""

  def _make(self, **kwargs):
    defaults = dict(
      model="EmailVerificationCode",
      field="user",
      path="/debug/nplusone/",
      method="GET",
      stacktrace='File "/app/webapp/config/urls.py", line 55, in debug_nplusone_view',
      sql_log="SELECT * FROM email_verification_codes\n\nSELECT * FROM users WHERE id = ?",
      developer="홍길동",
    )
    return NPlusOneSlackMessage(**{**defaults, **kwargs})

  def test_build_text_contains_model_and_field(self):
    """build_text()에 모델명과 필드명이 포함된다."""
    msg = self._make()
    text = msg.build_text()
    self.assertIn("EmailVerificationCode", text)
    self.assertIn("user", text)

  def test_build_blocks_contains_model_field_info(self):
    """build_blocks()의 section에 모델/필드 정보가 포함된다."""
    msg = self._make()
    built = [b.build() for b in msg.build_blocks()]
    all_text = str(built)
    self.assertIn("EmailVerificationCode", all_text)
    self.assertIn("user", all_text)

  def test_build_stacktrace_blocks_includes_stacktrace_and_sql(self):
    """build_stacktrace_blocks()가 stacktrace와 SQL 섹션을 모두 포함한다."""
    msg = self._make()
    blocks = msg.build_stacktrace_blocks()
    built = [b.build() for b in blocks]
    all_text = str(built)
    self.assertIn("Stacktrace", all_text)
    self.assertIn("SQL", all_text)

  def test_build_stacktrace_blocks_empty_when_no_content(self):
    """stacktrace와 sql_log가 모두 없으면 빈 리스트를 반환한다."""
    msg = self._make(stacktrace="", sql_log="")
    self.assertEqual(msg.build_stacktrace_blocks(), [])

  def test_build_stacktrace_blocks_only_stacktrace(self):
    """sql_log가 없으면 stacktrace 섹션만 반환한다."""
    msg = self._make(sql_log="")
    blocks = msg.build_stacktrace_blocks()
    built_text = str([b.build() for b in blocks])
    self.assertIn("Stacktrace", built_text)
    self.assertNotIn("SQL", built_text)

  def test_to_main_message_returns_slack_message(self):
    """to_main_message()가 SlackMessage 인스턴스를 반환한다."""
    msg = self._make()
    result = msg.to_main_message()
    self.assertIsInstance(result, SlackMessage)
    self.assertFalse(result.thread_reply)
