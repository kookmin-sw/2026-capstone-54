from common.services.base_query_service import BaseQueryService

from ..models import UserEmailNotificationSettings


class GetUserEmailNotificationSettingsService(BaseQueryService):

  def execute(self) -> UserEmailNotificationSettings:
    settings, _ = UserEmailNotificationSettings.objects.get_or_create(
      user=self.user,
      defaults=UserEmailNotificationSettings.default_consent_defaults(),
    )
    return settings
