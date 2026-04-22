from api.v1.users.serializers import AuthResponseSerializer, SignInSerializer
from common.permissions import AllowAny
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from users.services import SignInService

from .token_cookie import set_refresh_cookie


@extend_schema(tags=["사용자"])
class SignInAPIView(BaseAPIView):
  """로그인. email, password를 받아 JWT 토큰을 발급한다."""

  permission_classes = [AllowAny]
  serializer_class = SignInSerializer

  @extend_schema(
    summary="로그인",
    request=SignInSerializer,
    responses={200: AuthResponseSerializer},
  )
  def post(self, request):
    serializer = SignInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    token, user = SignInService(
      email=data["email"],
      password=data["password"],
    ).perform()
    response_data = {
      "access": str(token.access_token),
      "is_email_confirmed": user.is_email_confirmed,
      "is_profile_completed": user.is_profile_completed,
    }
    response = Response(response_data)
    set_refresh_cookie(response, str(token))
    return response
