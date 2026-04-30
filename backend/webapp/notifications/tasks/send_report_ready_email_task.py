from common.tasks.base_task import BaseTask
from config.celery import app


class SendReportReadyEmailTask(BaseTask):

  def run(self, user_id: int, report_url: str = "", interview_title: str = ""):
    from users.models import User

    from ..services import SendReportReadyEmailService

    user = User.objects.get(id=user_id)
    return SendReportReadyEmailService(
      user=user,
      report_url=report_url,
      interview_title=interview_title,
    ).perform()


RegisteredSendReportReadyEmailTask = app.register_task(SendReportReadyEmailTask())
