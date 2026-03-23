from common.exceptions import ValidationException
from common.services import BaseService
from django.utils import timezone


class VerifyEmailService(BaseService):
  """OTP 코드 검증 후 이메일 인증 처리 서비스."""

  required_value_kwargs = ["code"]

  def validate(self):
    from users.models import EmailVerificationCode

    user = self.user
    code = self.kwargs["code"]

    # 1. 이미 인증된 경우
    if user.email_confirmed_at is not None:
      raise ValidationException("이미 인증된 이메일입니다.")

    # 2. 유효한(미사용 + 미만료) 인증 코드 조회
    try:
      code_obj = EmailVerificationCode.objects.active(user).get(code=code)
    except EmailVerificationCode.DoesNotExist:
      raise ValidationException("유효하지 않은 인증 코드입니다.")

    self._code_obj = code_obj

  def execute(self):
    now = timezone.now()
    self._code_obj.used_at = now
    self._code_obj.save(update_fields=["used_at"])

    self.user.email_confirmed_at = now
    self.user.save(update_fields=["email_confirmed_at"])
