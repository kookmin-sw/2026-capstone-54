"""
N+1 쿼리 감지 Slack 알림 태스크.

Usage::

  RegisteredSendNPlusOneAlertTask.delay(
      model="User",
      field="profile",
      stacktrace="...",
  )
"""

from common.slack.messages.nplusone_message import NPlusOneSlackMessage
from common.slack.sender import SlackMessage
from common.tasks.send_slack_message_task import SendSlackMessageTask
from config.celery import app
from django.conf import settings


class SendNPlusOneAlertTask(SendSlackMessageTask):
  """N+1 쿼리 감지를 Slack 에 비동기로 알린다."""

  def build_channel(self) -> str:
    return getattr(settings, "SLACK_CHANNEL_NPLUSONE", "")

  def build_messages(self, **kwargs) -> list[SlackMessage]:
    msg = NPlusOneSlackMessage(
      model=kwargs.get("model", "Unknown"),
      field=kwargs.get("field", "Unknown"),
      path=kwargs.get("path", ""),
      method=kwargs.get("method", ""),
      stacktrace=kwargs.get("stacktrace", ""),
      sql_log=kwargs.get("sql_log", ""),
      developer=getattr(settings, "DEVELOPER", ""),
    )
    return [
      msg.to_main_message(),
      *msg.blocks_to_thread_messages(msg.build_stacktrace_blocks(), "Stacktrace"),
    ]


RegisteredSendNPlusOneAlertTask = app.register_task(SendNPlusOneAlertTask())
