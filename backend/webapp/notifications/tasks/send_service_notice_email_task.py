from common.tasks.base_task import BaseTask
from config.celery import app


class SendServiceNoticeEmailTask(BaseTask):

  def run(self, user_id: int, subject: str, title: str, body_html: str):
    from users.models import User

    from ..services import SendServiceNoticeEmailService

    user = User.objects.get(id=user_id)
    return SendServiceNoticeEmailService(
      user=user,
      subject=subject,
      title=title,
      body_html=body_html,
    ).perform()


RegisteredSendServiceNoticeEmailTask = app.register_task(SendServiceNoticeEmailTask())
