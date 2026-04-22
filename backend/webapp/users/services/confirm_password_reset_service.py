from common.exceptions import ValidationException
from common.services import BaseService
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone


class ConfirmPasswordResetService(BaseService):
  """토큰을 검증하고 비밀번호를 재설정한다."""

  required_value_kwargs = ["token", "new_password"]

  def assign_attributes(self):
    self.token_uuid = self.kwargs["token"]

  def assign_attributes_with_lock(self):
    from users.models import PasswordResetToken

    self.password_reset_token = self.get_or_404(
      PasswordResetToken.objects.select_related("user").select_for_update(),
      token=self.token_uuid,
    )

  def validate(self):
    """비밀번호 유효성만 사전 검증한다. 토큰 검증은 execute()에서 select_for_update()와 함께 수행."""
    try:
      validate_password(self.kwargs["new_password"])
    except DjangoValidationError as e:
      raise ValidationException(field_errors={"new_password": list(e.messages)})

    if self.password_reset_token.is_used:
      raise ValidationException(field_errors={"token": ["이미 사용된 토큰입니다."]})

    if self.password_reset_token.is_expired:
      raise ValidationException(field_errors={"token": ["만료된 토큰입니다."]})

  def execute(self):
    user = self.password_reset_token.user
    user.set_password(self.kwargs["new_password"])
    user.save(update_fields=["password"])

    self.password_reset_token.used_at = timezone.now()
    self.password_reset_token.save(update_fields=["used_at"])
