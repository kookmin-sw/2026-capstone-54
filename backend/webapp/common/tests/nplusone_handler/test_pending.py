"""
nplusone_handler.pending 모듈 테스트.

모듈 레벨 전역 상태(_seen, _pending)를 각 테스트 전후로 초기화하여 격리한다.
Celery task 전송은 mock 처리한다.
"""

from unittest.mock import patch

import common.nplusone_handler.pending as pending_module
from common.nplusone_handler.pending import PendingAlert, flush, is_duplicate, register
from django.test import TestCase


class PendingStateIsolationMixin:
  """각 테스트 전후로 pending 모듈 전역 상태를 초기화한다."""

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


class IsDuplicateTest(PendingStateIsolationMixin, TestCase):
  """is_duplicate 중복 감지 테스트"""

  def test_first_occurrence_is_not_duplicate(self):
    """처음 감지된 (request_id, model, field) 조합은 중복이 아니다."""
    self.assertFalse(is_duplicate("req-1", "User", "profile"))

  def test_second_occurrence_is_duplicate(self):
    """같은 요청에서 동일 (model, field)가 다시 감지되면 중복이다."""
    is_duplicate("req-1", "User", "profile")
    self.assertTrue(is_duplicate("req-1", "User", "profile"))

  def test_different_request_id_is_not_duplicate(self):
    """다른 request_id면 같은 (model, field)도 중복이 아니다."""
    is_duplicate("req-1", "User", "profile")
    self.assertFalse(is_duplicate("req-2", "User", "profile"))

  def test_different_field_is_not_duplicate(self):
    """같은 요청이라도 다른 field면 중복이 아니다."""
    is_duplicate("req-1", "User", "profile")
    self.assertFalse(is_duplicate("req-1", "User", "email"))


class RegisterAndFlushTest(PendingStateIsolationMixin, TestCase):
  """register / flush 흐름 테스트"""

  def _make_alert(self, model="User", field="profile") -> PendingAlert:
    return PendingAlert(
      model=model,
      field=field,
      path="/api/test/",
      method="GET",
      stacktrace="traceback...",
      query_snapshot_index=0,
    )

  @patch("common.nplusone_handler.pending.collect_sql", return_value="SELECT ...")
  @patch("common.tasks.send_nplusone_alert_task.RegisteredSendNPlusOneAlertTask.delay")
  def test_flush_sends_task_for_each_alert(self, mock_delay, mock_sql):
    """flush()가 등록된 alert 수만큼 Celery task를 전송한다."""
    register("req-1", self._make_alert("User", "profile"))
    register("req-1", self._make_alert("Order", "user"))

    flush("req-1")

    self.assertEqual(mock_delay.call_count, 2)

  @patch("common.nplusone_handler.pending.collect_sql", return_value="")
  @patch("common.tasks.send_nplusone_alert_task.RegisteredSendNPlusOneAlertTask.delay")
  def test_flush_clears_pending_after_send(self, mock_delay, mock_sql):
    """flush() 후 해당 request_id의 pending이 비워진다."""
    register("req-1", self._make_alert())
    flush("req-1")

    # 두 번째 flush는 아무것도 전송하지 않는다
    flush("req-1")
    self.assertEqual(mock_delay.call_count, 1)

  @patch("common.tasks.send_nplusone_alert_task.RegisteredSendNPlusOneAlertTask.delay")
  def test_flush_unknown_request_id_does_nothing(self, mock_delay):
    """등록되지 않은 request_id로 flush()를 호출해도 아무것도 전송하지 않는다."""
    flush("unknown-req")
    mock_delay.assert_not_called()

  @patch("common.nplusone_handler.pending.collect_sql", return_value="SELECT ...")
  @patch("common.tasks.send_nplusone_alert_task.RegisteredSendNPlusOneAlertTask.delay")
  def test_flush_passes_correct_kwargs_to_task(self, mock_delay, mock_sql):
    """flush()가 alert의 model/field/path/method/stacktrace를 task에 전달한다."""
    alert = self._make_alert("EmailVerificationCode", "user")
    alert.path = "/debug/nplusone/"
    alert.method = "GET"
    alert.stacktrace = "traceback line"
    register("req-1", alert)

    flush("req-1")

    call_kwargs = mock_delay.call_args.kwargs
    self.assertEqual(call_kwargs["model"], "EmailVerificationCode")
    self.assertEqual(call_kwargs["field"], "user")
    self.assertEqual(call_kwargs["path"], "/debug/nplusone/")
    self.assertEqual(call_kwargs["method"], "GET")
    self.assertEqual(call_kwargs["stacktrace"], "traceback line")


class EvictExpiredTest(PendingStateIsolationMixin, TestCase):
  """_evict_expired TTL 만료 정리 테스트"""

  def _make_alert(self) -> PendingAlert:
    return PendingAlert(
      model="User",
      field="profile",
      path="/api/test/",
      method="GET",
      stacktrace="",
      query_snapshot_index=0,
    )

  def test_evict_removes_expired_pending(self):
    """TTL이 지난 _pending 항목은 _evict_expired()로 제거된다."""
    alert = self._make_alert()
    alert.registered_at = 0.0  # 과거 타임스탬프로 강제 만료
    pending_module._pending["req-expired"] = [alert]

    pending_module._evict_expired()

    self.assertNotIn("req-expired", pending_module._pending)

  def test_evict_keeps_fresh_pending(self):
    """TTL이 지나지 않은 _pending 항목은 유지된다."""
    alert = self._make_alert()  # registered_at = time.monotonic() (현재)
    pending_module._pending["req-fresh"] = [alert]

    pending_module._evict_expired()

    self.assertIn("req-fresh", pending_module._pending)

  def test_evict_removes_expired_seen(self):
    """TTL이 지난 _seen 항목도 함께 제거된다."""
    pending_module._seen[("req-old", "User", "profile")] = 0.0

    pending_module._evict_expired()

    self.assertNotIn(("req-old", "User", "profile"), pending_module._seen)
