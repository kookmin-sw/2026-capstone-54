from common.services.base_send_email_service import BaseSendEmailService


class SendPasswordResetEmailService(BaseSendEmailService):
  icon_name = "email_images/lock-icon.png"
  required_value_kwargs = ["token_uuid"]

  def execute(self):
    user = self.user
    token_uuid = self.kwargs["token_uuid"]
    reset_url = f"http://localhost:3000/reset-password?token={token_uuid}"
    self._send_email(
      subject="비밀번호 재설정 안내",
      template_name="users/email/password_reset.html",
      context={
        "user_email": user.email,
        "reset_url": reset_url
      },
      recipient_email=user.email,
    )
