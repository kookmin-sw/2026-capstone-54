from api.v1.users.serializers import VerifyEmailSerializer
from common.permissions import IsAuthenticated
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from users.services import VerifyEmailService


@extend_schema(tags=["사용자"])
class VerifyEmailAPIView(BaseAPIView):
  """이메일 인증. 6자리 OTP 코드를 받아 이메일을 인증 처리한다."""
  permission_classes = [IsAuthenticated]
  serializer_class = VerifyEmailSerializer

  @extend_schema(
    summary="이메일 인증",
    request=VerifyEmailSerializer,
    responses={200: None},
  )
  def post(self, request):
    serializer = VerifyEmailSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    VerifyEmailService(
      user=request.user,
      code=serializer.validated_data["code"],
    ).perform()
    return Response({"detail": "이메일 인증이 완료되었습니다."})
