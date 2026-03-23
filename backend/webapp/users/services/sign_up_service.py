from common.services import BaseService
from rest_framework_simplejwt.tokens import RefreshToken


class SignUpService(BaseService):
  """회원가입 서비스: User 생성, 이메일 인증 코드 발송(비동기), JWT 토큰 반환."""

  required_value_kwargs = ["email", "password", "name"]

  def execute(self):
    from users.models import User
    from users.tasks.send_sign_up_event_task import RegisteredSendSignUpEventTask
    from users.tasks.send_verification_email_task import RegisteredSendVerificationEmailTask

    email = self.kwargs["email"]
    password = self.kwargs["password"]
    name = self.kwargs["name"]

    user = User.objects.create_user(email=email, password=password, name=name)
    RegisteredSendVerificationEmailTask.delay(user_id=user.id)
    RegisteredSendSignUpEventTask.delay(email=email, name=name)
    token = RefreshToken.for_user(user)

    return token, user
