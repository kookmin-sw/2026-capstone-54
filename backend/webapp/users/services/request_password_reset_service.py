from datetime import timedelta

from common.services import BaseService
from django.conf import settings
from django.utils import timezone


class RequestPasswordResetService(BaseService):
  """비밀번호 재설정 이메일 발송을 요청한다."""

  required_value_kwargs = ["email"]

  def assign_attributes(self):
    from users.models import User

    email = self.kwargs["email"]
    self.user = self.get_or_404(User, email=email)

  def execute(self):
    from users.models import PasswordResetToken
    from users.tasks import RegisteredSendPasswordResetEmailTask

    # 기존 active 토큰 일괄 무효화
    PasswordResetToken.objects.active(self.user).update(used_at=timezone.now())
    # 새 토큰 생성
    expires_at = timezone.now() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES)
    token = PasswordResetToken.objects.create(user=self.user, expires_at=expires_at)

    # Celery 태스크로 이메일 발송 위임
    RegisteredSendPasswordResetEmailTask.delay(
      user_id=self.user.id,
      token_uuid=str(token.token),
    )
