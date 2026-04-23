from email.mime.image import MIMEImage

from common.services.base_service import BaseService
from django.conf import settings
from django.contrib.staticfiles import finders
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


class BaseSendEmailService(BaseService):
  logo_name = "email_images/mefit-logo.png"
  icon_name = None

  def _should_send_email(self) -> bool:
    environment = getattr(settings, "ENVIRONMENT", "development")
    return environment == "production"

  def _get_html_message(self, template_name: str, context: dict) -> str:
    return render_to_string(template_name, context)

  def _attach_file(self, filename: str, content_id: str) -> bytes | None:
    result = finders.find(filename)
    if result:
      with open(result, "rb") as f:
        logo_data = f.read()
      image = MIMEImage(logo_data, "png")
      image["Content-ID"] = f"<{content_id}>"
      image["Content-Disposition"] = "inline"
      return image
    return None

  def _attach_logo(self, email: EmailMultiAlternatives) -> None:
    image = self._attach_file(self.logo_name, "mefit-logo")
    if image:
      email.attach(image)

  def _attach_icon(self, email: EmailMultiAlternatives) -> None:
    if self.icon_name:
      image = self._attach_file(self.icon_name, "email-icon")
      if image:
        email.attach(image)

  def _send_email(
    self,
    subject: str,
    template_name: str,
    context: dict,
    recipient_email: str,
  ) -> None:
    if not self._should_send_email():
      return

    html_message = self._get_html_message(template_name, context)

    email = EmailMultiAlternatives(
      subject=subject,
      from_email=settings.DEFAULT_FROM_EMAIL,
      to=[recipient_email],
    )
    email.attach_alternative(html_message, "text/html")
    self._attach_logo(email)
    self._attach_icon(email)
    email.send()
