from api.v1.users.serializers import ConfirmPasswordResetSerializer
from common.permissions import AllowAny
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from users.services import ConfirmPasswordResetService  # 비밀번호 재설정 확인 서비스


@extend_schema(tags=["사용자"])
class ConfirmPasswordResetAPIView(BaseAPIView):
  """토큰을 검증하고 비밀번호를 재설정한다."""
  permission_classes = [AllowAny]
  serializer_class = ConfirmPasswordResetSerializer

  @extend_schema(
    summary="비밀번호 재설정 확인",
    request=ConfirmPasswordResetSerializer,
    responses={200: None},
  )
  def post(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    ConfirmPasswordResetService(
      token=serializer.validated_data["token"],
      new_password=serializer.validated_data["new_password"],
    ).perform()
    return Response({"message": "비밀번호가 변경되었습니다."}, status=200)
