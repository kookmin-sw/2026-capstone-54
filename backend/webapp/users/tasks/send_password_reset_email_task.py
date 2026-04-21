from common.tasks.base_task import BaseTask
from config.celery import app


class SendPasswordResetEmailTask(BaseTask):
  """비밀번호 재설정 이메일을 비동기로 발송한다."""

  def run(self, user_id: int, token_uuid: str):
    from users.models import User
    from users.services import SendPasswordResetEmailService

    user = User.objects.get(id=user_id)
    return SendPasswordResetEmailService(user=user, token_uuid=token_uuid).perform()  # perform() 호출로 실제 로직은 서비스가 수행


RegisteredSendPasswordResetEmailTask = app.register_task(SendPasswordResetEmailTask())
