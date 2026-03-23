from common.exceptions import UnauthorizedException
from common.services import BaseService
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


class SignInService(BaseService):
  """이메일/비밀번호로 인증 후 JWT 토큰을 발급한다."""

  required_value_kwargs = ["email", "password"]

  def validate(self):
    email = self.kwargs["email"]
    password = self.kwargs["password"]

    user = authenticate(request=None, email=email, password=password)
    if user is None:
      raise UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.")

    self._user = user

  def execute(self):
    return RefreshToken.for_user(self._user)
