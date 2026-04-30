from common.services.base_send_email_service import BaseSendEmailService

from ..enums import EmailNotificationType
from ..models import UserEmailNotificationSettings


class SendStreakReminderEmailService(BaseSendEmailService):
  icon_name = "email_images/mail-icon.png"

  def execute(self):
    user = self.user
    if not user.is_active or not user.email:
      return False

    settings, _ = UserEmailNotificationSettings.objects.get_or_create(
      user=user,
      defaults=UserEmailNotificationSettings.default_consent_defaults(),
    )
    if not settings.is_opted_in(EmailNotificationType.STREAK_REMINDER.value):
      return False

    self._send_email(
      subject="[MeFit] 오늘 면접 연습, 잊지 않으셨나요?",
      template_name="notifications/email/streak_reminder.html",
      context={
        "user_email": user.email,
        "user_name": user.name or user.email,
      },
      recipient_email=user.email,
    )
    return True
