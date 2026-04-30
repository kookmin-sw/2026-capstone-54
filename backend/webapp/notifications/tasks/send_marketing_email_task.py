from common.tasks.base_task import BaseTask
from config.celery import app


class SendMarketingEmailTask(BaseTask):

  def run(self, user_id: int, subject: str, title: str, body_html: str):
    from users.models import User

    from ..services import SendMarketingEmailService

    user = User.objects.get(id=user_id)
    return SendMarketingEmailService(
      user=user,
      subject=subject,
      title=title,
      body_html=body_html,
    ).perform()


RegisteredSendMarketingEmailTask = app.register_task(SendMarketingEmailTask())
