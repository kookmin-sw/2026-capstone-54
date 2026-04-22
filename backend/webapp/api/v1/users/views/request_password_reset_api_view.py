from api.v1.users.serializers import RequestPasswordResetSerializer
from common.permissions import AllowAny
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema  # swagger/API 문서 자동 생성용 데코레이터
from rest_framework.response import Response
from users.services import RequestPasswordResetService


@extend_schema(tags=["사용자"])
class RequestPasswordResetAPIView(BaseAPIView):
  """비밀번호 재설정 이메일을 발송한다."""
  permission_classes = [AllowAny]
  serializer_class = RequestPasswordResetSerializer  # 이 뷰에서 사용할 시리얼라이저 지정

  @extend_schema(
    summary="비밀번호 재설정 이메일 발송",
    request=RequestPasswordResetSerializer,
    responses={200: None},
  )
  def post(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    RequestPasswordResetService(email=serializer.validated_data["email"]).perform()
    return Response({"message": "이메일을 확인해주세요."}, status=200)
