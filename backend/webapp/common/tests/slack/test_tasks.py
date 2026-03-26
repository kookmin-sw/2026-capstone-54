"""
Slack 알림 태스크 테스트.

SlackSender.send_all() 을 mock 하여 실제 Slack API 호출 없이
태스크가 올바른 메시지를 구성하고 전송하는지 검증한다.
"""

from unittest.mock import patch

from common.slack.sender import SlackMessage
from django.test import TestCase, override_settings


@override_settings(
  CELERY_TASK_ALWAYS_EAGER=True,
  SLACK_CHANNEL_ERROR="C_ERROR",
  SLACK_CHANNEL_NPLUSONE="C_NPLUSONE",
  DEVELOPER="테스트개발자",
)
class SendErrorAlertTaskTest(TestCase):
  """SendErrorAlertTask 테스트"""

  @patch("common.slack.sender.SlackSender.send_all")
  def test_sends_main_and_thread_messages(self, mock_send_all):
    """에러 알림 태스크가 메인 메시지 + traceback 스레드 메시지를 전송한다."""
    from common.tasks.send_error_alert_task import RegisteredSendErrorAlertTask

    RegisteredSendErrorAlertTask.delay(
      error_type="ValueError",
      error_message="테스트 에러",
      path="/api/v1/test/",
      method="POST",
      traceback="Traceback:\n  File test.py line 1",
    )

    mock_send_all.assert_called_once()
    messages: list[SlackMessage] = mock_send_all.call_args[0][0]

    # 메인 메시지 1개 + 스레드 메시지 1개 이상
    self.assertGreaterEqual(len(messages), 2)
    self.assertFalse(messages[0].thread_reply)
    self.assertTrue(messages[1].thread_reply)

  @patch("common.slack.sender.SlackSender.send_all")
  def test_main_message_text_contains_error_type(self, mock_send_all):
    """메인 메시지 text에 에러 유형이 포함된다."""
    from common.tasks.send_error_alert_task import RegisteredSendErrorAlertTask

    RegisteredSendErrorAlertTask.delay(
      error_type="RuntimeError",
      error_message="의도적 예외",
    )

    messages: list[SlackMessage] = mock_send_all.call_args[0][0]
    self.assertIn("RuntimeError", messages[0].text)

  @patch("common.slack.sender.SlackSender.send_all")
  def test_no_thread_when_traceback_empty(self, mock_send_all):
    """traceback이 없으면 스레드 메시지가 전송되지 않는다."""
    from common.tasks.send_error_alert_task import RegisteredSendErrorAlertTask

    RegisteredSendErrorAlertTask.delay(
      error_type="ValueError",
      error_message="에러",
      traceback="",
    )

    messages: list[SlackMessage] = mock_send_all.call_args[0][0]
    thread_messages = [m for m in messages if m.thread_reply]
    self.assertEqual(len(thread_messages), 0)

  @patch("common.slack.sender.SlackSender.send_all")
  def test_channel_is_set_correctly(self, mock_send_all):
    """태스크가 SLACK_CHANNEL_ERROR 채널로 전송한다."""
    from common.tasks.send_error_alert_task import SendErrorAlertTask

    task = SendErrorAlertTask()
    self.assertEqual(task.build_channel(), "C_ERROR")


@override_settings(
  CELERY_TASK_ALWAYS_EAGER=True,
  SLACK_CHANNEL_NPLUSONE="C_NPLUSONE",
  DEVELOPER="테스트개발자",
)
class SendNPlusOneAlertTaskTest(TestCase):
  """SendNPlusOneAlertTask 테스트"""

  @patch("common.slack.sender.SlackSender.send_all")
  def test_sends_main_and_thread_messages(self, mock_send_all):
    """N+1 알림 태스크가 메인 메시지 + stacktrace 스레드 메시지를 전송한다."""
    from common.tasks.send_nplusone_alert_task import RegisteredSendNPlusOneAlertTask

    RegisteredSendNPlusOneAlertTask.delay(
      model="EmailVerificationCode",
      field="user",
      path="/debug/nplusone/",
      method="GET",
      stacktrace='File "/app/webapp/config/urls.py", line 55',
      sql_log="SELECT * FROM email_verification_codes",
    )

    mock_send_all.assert_called_once()
    messages: list[SlackMessage] = mock_send_all.call_args[0][0]

    self.assertGreaterEqual(len(messages), 2)
    self.assertFalse(messages[0].thread_reply)
    self.assertTrue(messages[1].thread_reply)

  @patch("common.slack.sender.SlackSender.send_all")
  def test_main_message_text_contains_model_and_field(self, mock_send_all):
    """메인 메시지 text에 모델명과 필드명이 포함된다."""
    from common.tasks.send_nplusone_alert_task import RegisteredSendNPlusOneAlertTask

    RegisteredSendNPlusOneAlertTask.delay(
      model="User",
      field="profile",
    )

    messages: list[SlackMessage] = mock_send_all.call_args[0][0]
    self.assertIn("User", messages[0].text)
    self.assertIn("profile", messages[0].text)

  @patch("common.slack.sender.SlackSender.send_all")
  def test_no_thread_when_stacktrace_and_sql_empty(self, mock_send_all):
    """stacktrace와 sql_log가 모두 없으면 스레드 메시지가 전송되지 않는다."""
    from common.tasks.send_nplusone_alert_task import RegisteredSendNPlusOneAlertTask

    RegisteredSendNPlusOneAlertTask.delay(
      model="User",
      field="profile",
      stacktrace="",
      sql_log="",
    )

    messages: list[SlackMessage] = mock_send_all.call_args[0][0]
    thread_messages = [m for m in messages if m.thread_reply]
    self.assertEqual(len(thread_messages), 0)

  @patch("common.slack.sender.SlackSender.send_all")
  def test_channel_is_set_correctly(self, mock_send_all):
    """태스크가 SLACK_CHANNEL_NPLUSONE 채널로 전송한다."""
    from common.tasks.send_nplusone_alert_task import SendNPlusOneAlertTask

    task = SendNPlusOneAlertTask()
    self.assertEqual(task.build_channel(), "C_NPLUSONE")

  @patch("common.slack.sender.SlackSender.send_all")
  def test_long_stacktrace_splits_into_multiple_thread_messages(self, mock_send_all):
    """2900자 초과 stacktrace는 여러 스레드 메시지로 분할된다."""
    from common.tasks.send_nplusone_alert_task import RegisteredSendNPlusOneAlertTask

    long_stacktrace = "x" * 9000

    RegisteredSendNPlusOneAlertTask.delay(
      model="User",
      field="profile",
      stacktrace=long_stacktrace,
      sql_log="",
    )

    messages: list[SlackMessage] = mock_send_all.call_args[0][0]
    thread_messages = [m for m in messages if m.thread_reply]
    self.assertGreater(len(thread_messages), 1)
