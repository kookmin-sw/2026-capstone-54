from api.v1.users.serializers import SignOutSerializer
from common.permissions import IsAuthenticated
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from users.services import SignOutService


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
    serializer = SignOutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    SignOutService(user=request.user, refresh_token=serializer.validated_data["refresh"]).perform()
    return Response(status=status.HTTP_205_RESET_CONTENT)
