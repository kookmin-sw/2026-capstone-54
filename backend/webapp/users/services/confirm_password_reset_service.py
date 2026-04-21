from common.exceptions import ValidationException
from common.services import BaseService
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone


class ConfirmPasswordResetService(BaseService):
  """토큰을 검증하고 비밀번호를 재설정한다."""

  required_value_kwargs = ["token", "new_password"]

  def validate(self):
    from users.models import (
      PasswordResetToken,  # 같은 앱(users) 내에서 모델 ↔ 서비스가 서로 참조할 가능성, 순환 임포트(circular import) 를 피하기 위한 패턴
    )

    token_uuid = self.kwargs["token"]

    try:
      self._token = PasswordResetToken.objects.select_related("user").get(token=token_uuid)
    except PasswordResetToken.DoesNotExist:
      raise ValidationException(field_errors={"token": ["유효하지 않은 토큰입니다."]})

    if self._token.is_used:
      raise ValidationException(field_errors={"token": ["이미 사용된 토큰입니다."]})

    if self._token.is_expired:
      raise ValidationException(field_errors={"token": ["만료된 토큰입니다."]})

    try:
      validate_password(self.kwargs["new_password"], user=self._token.user)
    except DjangoValidationError as e:
      raise ValidationException(field_errors={"new_password": list(e.messages)})

  def execute(self):
    user = self._token.user
    user.set_password(self.kwargs["new_password"])
    user.save(update_fields=["password"])

    self._token.used_at = timezone.now()
    self._token.save(update_fields=["used_at"])
