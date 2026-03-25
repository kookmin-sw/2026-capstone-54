from api.v1.users.serializers import AuthResponseSerializer, SignUpSerializer
from common.permissions import AllowAny
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from users.services import SignUpService


@extend_schema(tags=["사용자"])
class SignUpAPIView(BaseAPIView):
  """회원가입. email, password, name을 받아 User를 생성하고 JWT 토큰을 발급한다."""
  permission_classes = [AllowAny]
  serializer_class = SignUpSerializer

  @extend_schema(
    summary="회원가입",
    request=SignUpSerializer,
    responses={201: AuthResponseSerializer},
  )
  def post(self, request):
    serializer = SignUpSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    token, user = SignUpService(
      email=data["email"],
      password=data["password1"],
      name=data["name"],
    ).perform()
    response_data = {
      "access": str(token.access_token),
      "refresh": str(token),
      "is_email_confirmed": user.is_email_confirmed,
      "is_profile_completed": user.is_profile_completed,
    }
    return Response(response_data, status=status.HTTP_201_CREATED)
