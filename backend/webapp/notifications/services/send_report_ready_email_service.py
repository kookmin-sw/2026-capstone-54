from common.services.base_send_email_service import BaseSendEmailService

from ..enums import EmailNotificationType
from ..models import UserEmailNotificationSettings


class SendReportReadyEmailService(BaseSendEmailService):
  icon_name = "email_images/mail-icon.png"

  def execute(self):
    user = self.user
    settings, _ = UserEmailNotificationSettings.objects.get_or_create(
      user=user,
      defaults=UserEmailNotificationSettings.default_consent_defaults(),
    )
    if not settings.is_opted_in(EmailNotificationType.REPORT_READY.value):
      return False

    report_url = self.kwargs.get("report_url", "")
    interview_title = self.kwargs.get("interview_title", "")

    self._send_email(
      subject="[MeFit] AI 면접 리뷰 리포트가 준비되었습니다",
      template_name="notifications/email/report_ready.html",
      context={
        "user_email": user.email,
        "user_name": user.name or user.email,
        "report_url": report_url,
        "interview_title": interview_title,
      },
      recipient_email=user.email,
    )
    return True
