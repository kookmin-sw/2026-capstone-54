import secrets
import string
from datetime import timedelta

from common.services.base_send_email_service import BaseSendEmailService
from django.utils import timezone


class SendVerificationEmailService(BaseSendEmailService):
  icon_name = "email_images/mail-icon.png"

  def execute(self):
    from users.models import EmailVerificationCode

    user = self.user
    expiry_minutes = 10
    code = self._generate_code()
    expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
    EmailVerificationCode.objects.create(user=user, code=code, expires_at=expires_at)
    self._send_email(
      subject="이메일 인증 코드",
      template_name="users/email/verification_code.html",
      context={
        "code": code,
        "user_email": user.email
      },
      recipient_email=user.email,
    )
    return code

  def _generate_code(self):
    charset = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(charset) for _ in range(6))
