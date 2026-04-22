from common.services import BaseService
from django.conf import settings
from django.core.mail import send_mail  # Django 내장 이메일 발송 함수
from django.template.loader import render_to_string  # HTML 템플릿을 문자열로 렌더링


class SendPasswordResetEmailService(BaseService):
  """비밀번호 재설정 링크를 이메일로 발송한다."""

  required_value_kwargs = ["token_uuid"]

  def execute(self):
    user = self.user
    token_uuid = self.kwargs["token_uuid"]
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    reset_url = f"{frontend_url}/reset-password?token={token_uuid}"
    # 사용자가 이 링크를 클릭하면 프론트엔드 비밀번호 재설정 페이지로 이동

    # 프로덕션 환경에서만 실제 이메일 발송
    environment = getattr(settings, "ENVIRONMENT", "development")
    if environment != "production":
      return

    html_message = render_to_string(
      "users/email/password_reset.html",
      {
        "user_email": user.email,
        "reset_url": reset_url,
      },
    )
    send_mail(
      subject="비밀번호 재설정 안내",
      message=f"비밀번호 재설정 링크: {reset_url}",
      from_email=settings.DEFAULT_FROM_EMAIL,
      recipient_list=[user.email],
      html_message=html_message,
    )
