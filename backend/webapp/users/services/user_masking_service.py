from common.services import BaseService

MASKING_FIELDS = [
  "name",
  "email",
  "password",
  "email_confirmed_at",
  "profile_completed_at",
  "updated_at",
]


class UserMaskingService(BaseService):
  """소프트 삭제 시 개인정보를 마스킹한다."""

  def validate(self):
    if self.user is None:
      from common.exceptions import ValidationException
      raise ValidationException("user은(는) 필수입니다.")

  def execute(self):
    user = self.user
    user.assign_attributes(
      {
        "name": f"deleted_user+{user.pk}",
        "email": f"deleted_user+{user.pk}@mefit.chat",
        "email_confirmed_at": None,
        "profile_completed_at": None,
      }
    )
    user.set_unusable_password()
    user.save(update_fields=MASKING_FIELDS)
    return user
