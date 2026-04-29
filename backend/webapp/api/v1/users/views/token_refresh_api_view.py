from common.permissions import AllowAny
from common.views import BaseAPIView
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from .token_cookie import REFRESH_COOKIE_NAME, set_refresh_cookie


class TokenRefreshCookieSerializer(serializers.Serializer):
  refresh = serializers.CharField(required=False, allow_blank=True)


class TokenRefreshResponseSerializer(serializers.Serializer):
  access = serializers.CharField()


@extend_schema(tags=["사용자"])
class TokenRefreshAPIView(BaseAPIView):
  """리프레시 토큰을 쿠키(우선) 또는 요청 바디에서 받아 access 토큰을 재발급한다."""

  permission_classes = [AllowAny]
  serializer_class = TokenRefreshCookieSerializer

  @extend_schema(
    summary="토큰 갱신",
    request=TokenRefreshCookieSerializer,
    responses={200: TokenRefreshResponseSerializer},
  )
  def post(self, request):
    serializer = TokenRefreshCookieSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    refresh_raw = request.COOKIES.get(REFRESH_COOKIE_NAME) or serializer.validated_data.get("refresh")
    if not refresh_raw:
      raise ValidationError({"refresh": ["이 필드는 필수입니다."]})

    try:
      simplejwt_serializer = TokenRefreshSerializer(data={"refresh": refresh_raw})
      simplejwt_serializer.is_valid(raise_exception=True)
      validated = simplejwt_serializer.validated_data

      access = validated["access"]
      rotated_refresh = validated.get("refresh", refresh_raw)

      response = Response({"access": access})
      set_refresh_cookie(response, rotated_refresh)
      return response
    except TokenError as exc:
      raise AuthenticationFailed(str(exc))
    except get_user_model().DoesNotExist:
      raise AuthenticationFailed("사용자를 찾을 수 없습니다. 탈퇴했거나 삭제된 계정일 수 있습니다.")
