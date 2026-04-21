from datetime import timedelta

from common.services import BaseService
from django.conf import settings
from django.utils import timezone


class RequestPasswordResetService(BaseService):
  """비밀번호 재설정 이메일 발송을 요청한다."""

  required_value_kwargs = ["email"]

  def execute(self):
    from users.models import PasswordResetToken, User
    from users.tasks import RegisteredSendPasswordResetEmailTask

    email = self.kwargs["email"]

    try:
      user = User.objects.get(email=email)
    except User.DoesNotExist:
      return  # 보안: 이메일 존재 여부를 노출하지 않는다

    # 기존 active 토큰 일괄 무효화
    PasswordResetToken.objects.active(user).update(used_at=timezone.now())

    # 새 토큰 생성
    expiry_minutes = getattr(settings, "PASSWORD_RESET_TOKEN_EXPIRY_MINUTES", 15)
    token = PasswordResetToken.objects.create(
      user=user,
      expires_at=timezone.now() + timedelta(minutes=expiry_minutes),
    )

    # Celery 태스크로 이메일 발송 위임
    RegisteredSendPasswordResetEmailTask.delay(
      user_id=user.id,
      token_uuid=str(token.token),
    )
