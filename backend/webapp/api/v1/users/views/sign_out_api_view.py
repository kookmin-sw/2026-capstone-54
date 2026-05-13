from api.v1.users.serializers import SignOutSerializer
from common.permissions import IsAuthenticated
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from users.services import SignOutService

from .token_cookie import REFRESH_COOKIE_NAME, clear_refresh_cookie


@extend_schema(tags=["사용자"])
class SignOutAPIView(BaseAPIView):
  """로그아웃. 리프레시 토큰을 블랙리스트에 등록한다."""

  permission_classes = [IsAuthenticated]
  serializer_class = SignOutSerializer

  @extend_schema(
    summary="로그아웃",
    request=SignOutSerializer,
    responses={205: None},
  )
  def post(self, request):
    refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)
    serializer = SignOutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    effective_refresh = refresh_token or serializer.validated_data.get("refresh")
    if not effective_refresh:
      raise ValidationError({"refresh": ["이 필드는 필수입니다."]})

    SignOutService(
      user=request.user,
      refresh_token=effective_refresh,
    ).perform()
    response = Response(status=status.HTTP_205_RESET_CONTENT)
    clear_refresh_cookie(response)
    return response
