import os

from common.services import BaseService
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


class SendPasswordResetEmailService(BaseService):
  """비밀번호 재설정 링크를 이메일로 발송한다."""

  required_value_kwargs = ["token_uuid"]

  def execute(self):
    user = self.user
    token_uuid = self.kwargs["token_uuid"]
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    reset_url = f"{frontend_url}/reset-password?token={token_uuid}"

    environment = getattr(settings, "ENVIRONMENT", "development")
    if environment != "production":
      return

    logo_path = os.path.join(settings.BASE_DIR, "webapp", "staticfiles", "email_images", "mefit-logo.png")

    html_message = render_to_string(
      "users/email/password_reset.html",
      {
        "user_email": user.email,
        "reset_url": reset_url,
      },
    )

    email = EmailMultiAlternatives(
      subject="비밀번호 재설정 안내",
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
