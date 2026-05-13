from common.exceptions import ValidationException
from common.services.base_service import BaseService

from ..enums import EmailNotificationType
from ..models import UserEmailNotificationSettings


class UpdateUserEmailNotificationSettingsService(BaseService):
  """사용자 이메일 알림 동의 상태를 업데이트한다.

  Args:
    user: 대상 사용자 (BaseService 가 self.user 로 처리).
    consents: {notification_type_value(snake_case): bool} 형태의 dict.
      예: {"streak_reminder": True, "marketing": False}
      알 수 없는 키는 검증 단계에서 ValidationException(400) 으로 반환.

  반환: 업데이트된 UserEmailNotificationSettings 인스턴스.
  """

  required_value_kwargs = ["consents"]

  def validate(self):
    consents = self.kwargs["consents"]
    if not isinstance(consents, dict):
      raise ValidationException("consents는 dict 형태여야 합니다.")

    valid_values = {member.value for member in EmailNotificationType}
    invalid_keys = [key for key in consents.keys() if key not in valid_values]
    if invalid_keys:
      raise ValidationException(f"알 수 없는 알림 타입: {', '.join(invalid_keys)}")

    for key, value in consents.items():
      if not isinstance(value, bool):
        raise ValidationException(f"{key} 값은 boolean 이어야 합니다.")

  def execute(self) -> UserEmailNotificationSettings:
    consents: dict[str, bool] = self.kwargs["consents"]

    settings, _ = UserEmailNotificationSettings.objects.select_for_update().get_or_create(
      user=self.user,
      defaults=UserEmailNotificationSettings.default_consent_defaults(),
    )

    update_fields = ["updated_at"]
    for notification_type, opted_in in consents.items():
      in_field, out_field = settings.apply_consent(notification_type, opted_in)
      update_fields.extend([in_field, out_field])

    settings.save(update_fields=update_fields)
    return settings
