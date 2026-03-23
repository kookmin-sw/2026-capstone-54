"""
회원가입 이벤트 Slack 알림 태스크.

Usage::

  RegisteredSendSignUpEventTask.delay(email="user@example.com", name="홍길동")
"""

from common.slack.messages.event_message import EventSlackMessage
from common.slack.sender import SlackMessage
from common.tasks.send_slack_message_task import SendSlackMessageTask
from config.celery import app
from django.conf import settings


class SendSignUpEventTask(SendSlackMessageTask):
  """회원가입 이벤트를 Slack 에 비동기로 알린다."""

  def build_channel(self) -> str:
    return getattr(settings, "SLACK_CHANNEL_EVENT", "")

  def build_messages(self, **kwargs) -> list[SlackMessage]:
    msg = EventSlackMessage(
      event_name="신규 회원가입",
      fields={
        "이메일": kwargs["email"],
        "이름": kwargs["name"]
      },
    )
    return [SlackMessage(text=msg.build_text(), blocks=msg.render_blocks())]


RegisteredSendSignUpEventTask = app.register_task(SendSignUpEventTask())
