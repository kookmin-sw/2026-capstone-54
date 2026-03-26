"""
NPlusOneSlackHandler 통합 테스트.

logging.Handler.emit() → pending 등록 → flush() → Celery task 전송
전체 흐름을 mock 기반으로 검증한다.
"""

import logging
from unittest.mock import patch

import common.nplusone_handler.pending as pending_module
from common.nplusone_handler.handler import NPlusOneSlackHandler
from django.test import TestCase


class PendingStateIsolationMixin:

  def setUp(self):
    super().setUp()
    pending_module._seen.clear()
    pending_module._pending.clear()
    pending_module._emit_count = 0

  def tearDown(self):
    super().tearDown()
    pending_module._seen.clear()
    pending_module._pending.clear()
    pending_module._emit_count = 0


class NPlusOneSlackHandlerEmitTest(PendingStateIsolationMixin, TestCase):
  """NPlusOneSlackHandler.emit() 테스트"""

  def _make_record(self, msg: str) -> logging.LogRecord:
    record = logging.LogRecord(
      name="nplusone",
      level=logging.WARNING,
      pathname="",
      lineno=0,
      msg=msg,
      args=(),
      exc_info=None,
    )
    return record

  @patch("common.nplusone_handler.handler.get_request_id", return_value="req-test")
  @patch("common.nplusone_handler.handler.get_request_info", return_value=("/api/test/", "GET"))
  @patch("common.nplusone_handler.handler.get_query_count", return_value=3)
  @patch("common.nplusone_handler.handler.extract_app_stacktrace", return_value="traceback...")
  def test_emit_registers_pending_alert(self, mock_st, mock_qc, mock_info, mock_id):
    """emit()이 호출되면 pending 저장소에 alert가 등록된다."""
    handler = NPlusOneSlackHandler()
    record = self._make_record("Potential n+1 query detected on `User.profile`")

    handler.emit(record)

    self.assertIn("req-test", pending_module._pending)
    alert = pending_module._pending["req-test"][0]
    self.assertEqual(alert.model, "User")
    self.assertEqual(alert.field, "profile")
    self.assertEqual(alert.path, "/api/test/")
    self.assertEqual(alert.method, "GET")
    self.assertEqual(alert.query_snapshot_index, 3)

  @patch("common.nplusone_handler.handler.get_request_id", return_value="req-dup")
  @patch("common.nplusone_handler.handler.get_request_info", return_value=("/api/test/", "GET"))
  @patch("common.nplusone_handler.handler.get_query_count", return_value=0)
  @patch("common.nplusone_handler.handler.extract_app_stacktrace", return_value="")
  def test_emit_deduplicates_same_model_field(self, mock_st, mock_qc, mock_info, mock_id):
    """같은 요청에서 동일 (model, field)가 두 번 emit되면 한 번만 등록된다."""
    handler = NPlusOneSlackHandler()
    record = self._make_record("Potential n+1 query detected on `User.profile`")

    handler.emit(record)
    handler.emit(record)

    alerts = pending_module._pending.get("req-dup", [])
    self.assertEqual(len(alerts), 1)

  @patch("common.nplusone_handler.handler.get_request_id", return_value="req-unknown")
  @patch("common.nplusone_handler.handler.get_request_info", return_value=("", ""))
  @patch("common.nplusone_handler.handler.get_query_count", return_value=0)
  @patch("common.nplusone_handler.handler.extract_app_stacktrace", return_value="")
  def test_emit_uses_unknown_when_pattern_not_matched(self, mock_st, mock_qc, mock_info, mock_id):
    """nplusone 패턴이 없는 메시지는 model/field를 Unknown으로 등록한다."""
    handler = NPlusOneSlackHandler()
    record = self._make_record("some unrelated log message")

    handler.emit(record)

    alert = pending_module._pending["req-unknown"][0]
    self.assertEqual(alert.model, "Unknown")
    self.assertEqual(alert.field, "Unknown")
