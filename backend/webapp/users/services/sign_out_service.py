from common.exceptions import ValidationException
from common.services import BaseService
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken


class SignOutService(BaseService):
  required_value_kwargs = ["refresh_token"]

  def validate(self):
    try:
      token = RefreshToken(self.kwargs["refresh_token"])
    except TokenError:
      raise ValidationException("유효하지 않은 토큰입니다.")

    # 토큰의 user_id가 요청한 사용자와 일치하는지 검증
    if self.user is not None and str(token["user_id"]) != str(self.user.id):
      raise ValidationException("유효하지 않은 토큰입니다.")

    self._token = token

  def execute(self):
    try:
      self._token.blacklist()
    except TokenError:
      raise ValidationException("유효하지 않은 토큰입니다.")
