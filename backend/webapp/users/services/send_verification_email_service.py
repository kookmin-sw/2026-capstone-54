import os
import secrets
import string
from datetime import timedelta

from common.services import BaseService
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
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
    environment = getattr(settings, "ENVIRONMENT", "development")
    if environment != "production":
      return

    logo_path = os.path.join(settings.BASE_DIR, "webapp", "staticfiles", "email_images", "mefit-logo.png")

    html_message = render_to_string(
      "users/email/verification_code.html",
      {
        "code": code,
        "user_email": user.email,
      },
    )

    email = EmailMultiAlternatives(
      subject="이메일 인증 코드",
      from_email=settings.DEFAULT_FROM_EMAIL,
      to=[user.email],
    )
    email.attach_alternative(html_message, "text/html")

    if os.path.exists(logo_path):
      with open(logo_path, "rb") as f:
        logo_data = f.read()
      email.attach(
        "mefit-logo.png",
        logo_data,
        "image/png",
        headers=[("Content-ID", "<mefit-logo>")],
      )

    email.send()
