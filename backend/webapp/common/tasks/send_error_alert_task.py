"""
서버 에러(5xx) Slack 알림 태스크.

메인 메시지: 에러 요약
스레드 답글: 전체 traceback

Usage::

  RegisteredSendErrorAlertTask.delay(
      error_type="ValueError",
      error_message="something went wrong",
      path="/api/v1/users/sign-up/",
      method="POST",
      traceback="...",
  )
"""

from common.slack.messages.error_message import ErrorSlackMessage
from common.slack.sender import SlackMessage
from common.tasks.send_slack_message_task import SendSlackMessageTask
from config.celery import app
from django.conf import settings


class SendErrorAlertTask(SendSlackMessageTask):
  """5xx 에러를 Slack 에 비동기로 알린다."""

  def on_failure(self, exc, task_id, args, kwargs, einfo):
    return

  def build_channel(self) -> str:
    return getattr(settings, "SLACK_CHANNEL_ERROR", "")

  def build_messages(self, **kwargs) -> list[SlackMessage]:
    msg = ErrorSlackMessage(
      error_type=kwargs.get("error_type", "UnknownError"),
      error_message=kwargs.get("error_message", ""),
      path=kwargs.get("path", ""),
      method=kwargs.get("method", ""),
      traceback=kwargs.get("traceback", ""),
      developer=getattr(settings, "DEVELOPER", ""),
    )
    return [
      msg.to_main_message(),
      *msg.blocks_to_thread_messages(msg.build_traceback_blocks(), "Traceback"),
    ]


RegisteredSendErrorAlertTask = app.register_task(SendErrorAlertTask())
