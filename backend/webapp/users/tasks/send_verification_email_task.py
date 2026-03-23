from common.tasks.base_task import BaseTask
from config.celery import app


class SendVerificationEmailTask(BaseTask):
  """회원가입 후 이메일 인증 코드를 비동기로 발송한다."""

  def run(self, user_id: int):
    from users.models import User
    from users.services.send_verification_email_service import SendVerificationEmailService

    user = User.objects.get(id=user_id)
    return SendVerificationEmailService(user=user).perform()


RegisteredSendVerificationEmailTask = app.register_task(SendVerificationEmailTask())
