import secrets
import string
from datetime import timedelta

from common.services import BaseService
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone


class SendVerificationEmailService(BaseService):
  """6자리 OTP 코드를 생성하고 이메일로 발송한다."""

  def execute(self):
    from users.models import EmailVerificationCode

    user = self.user
    expiry_minutes = getattr(settings, "EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES", 10)
    code = self._generate_code()
    expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
    EmailVerificationCode.objects.create(user=user, code=code, expires_at=expires_at)
    self._send_email(user, code)
    return code

  def _generate_code(self):
    charset = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(charset) for _ in range(6))

  def _send_email(self, user, code):
    # Only send emails in production environment
    environment = getattr(settings, "ENVIRONMENT", "development")
    if environment != "production":
      return

    html_message = render_to_string(
      "users/email/verification_code.html",
      {
        "code": code,
        "user_email": user.email
      },
    )
    send_mail(
      subject="이메일 인증 코드",
      message=f"인증 코드: {code}",
      from_email=settings.DEFAULT_FROM_EMAIL,
      recipient_list=[user.email],
      html_message=html_message,
    )
