from common.tasks.base_task import BaseTask
from config.celery import app


class ResendVerifyEmailTask(BaseTask):
  """이메일 인증 재발송을 비동기로 처리한다."""

  def run(self, user_id: int):
    from users.models import User
    from users.services.resend_verify_email_service import ResendVerifyEmailService

    user = User.objects.get(id=user_id)
    return ResendVerifyEmailService(user=user).perform()


RegisteredResendVerifyEmailTask = app.register_task(ResendVerifyEmailTask())
