from common.services.base_send_email_service import BaseSendEmailService

from ..enums import EmailNotificationType
from ..models import UserEmailNotificationSettings


class SendMarketingEmailService(BaseSendEmailService):
  icon_name = "email_images/mail-icon.png"
  required_value_kwargs = ["subject", "title", "body_html"]

  def execute(self):
    user = self.user
    settings, _ = UserEmailNotificationSettings.objects.get_or_create(
      user=user,
      defaults=UserEmailNotificationSettings.default_consent_defaults(),
    )
    if not settings.is_opted_in(EmailNotificationType.MARKETING.value):
      return False

    self._send_email(
      subject=self.kwargs["subject"],
      template_name="notifications/email/marketing.html",
      context={
        "user_email": user.email,
        "user_name": user.name or user.email,
        "title": self.kwargs["title"],
        "body_html": self.kwargs["body_html"],
      },
      recipient_email=user.email,
    )
    return True
