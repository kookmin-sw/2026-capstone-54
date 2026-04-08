from api.v1.users.serializers import ChangePasswordSerializer
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from users.services import ChangePasswordService


@extend_schema(tags=["사용자"])
class ChangePasswordAPIView(BaseAPIView):
  """현재 비밀번호를 확인한 후 새 비밀번호로 변경한다."""
  serializer_class = ChangePasswordSerializer

  @extend_schema(
    summary="비밀번호 변경",
    request=ChangePasswordSerializer,
    responses={200: None},
  )
  def post(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    ChangePasswordService(
      user=self.current_user,
      old_password=serializer.validated_data["old_password"],
      new_password=serializer.validated_data["new_password"],
    ).perform()
    return Response({"message": "비밀번호가 변경되었습니다."}, status=200)
