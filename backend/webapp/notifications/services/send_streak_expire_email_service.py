from common.services.base_send_email_service import BaseSendEmailService

from ..enums import EmailNotificationType
from ..models import UserEmailNotificationSettings


class SendStreakExpireEmailService(BaseSendEmailService):
  icon_name = "email_images/mail-icon.png"

  def execute(self):
    user = self.user
    settings, _ = UserEmailNotificationSettings.objects.get_or_create(
      user=user,
      defaults=UserEmailNotificationSettings.default_consent_defaults(),
    )
    if not settings.is_opted_in(EmailNotificationType.STREAK_EXPIRE.value):
      return False

    current_streak = self.kwargs.get("current_streak", 0)

    self._send_email(
      subject="[MeFit] 자정까지 1시간! 스트릭이 끊기지 않도록",
      template_name="notifications/email/streak_expire.html",
      context={
        "user_email": user.email,
        "user_name": user.name or user.email,
        "current_streak": current_streak,
      },
      recipient_email=user.email,
    )
    return True
