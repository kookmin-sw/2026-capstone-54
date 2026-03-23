from common.exceptions import ValidationException
from common.services import BaseService
from django.utils import timezone
from users.services.send_verification_email_service import SendVerificationEmailService


class ResendVerifyEmailService(BaseService):
  """기존 미사용 OTP를 만료 처리하고 새 인증 코드를 발송한다."""

  def validate(self):
    from users.models import EmailVerificationCode

    user = self.user

    if user.email_confirmed_at is not None:
      raise ValidationException("이미 인증된 이메일입니다.")

    # 아직 만료되지 않고 미사용인 코드가 있으면 재전송 차단
    if EmailVerificationCode.objects.active(user).exists():
      raise ValidationException("이미 유효한 인증 코드가 존재합니다. 잠시 후 다시 시도해주세요.")

  def execute(self):
    from users.models import EmailVerificationCode

    user = self.user

    # 기존 미사용 코드 만료 처리
    EmailVerificationCode.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())

    SendVerificationEmailService(user=user).perform()
