from common.permissions import IsAuthenticated
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["사용자"])
class UnregisterAPIView(BaseAPIView):
  """회원탈퇴. 소프트 삭제 + 개인정보 마스킹 처리한다."""
  permission_classes = [IsAuthenticated]

  @extend_schema(
    summary="회원탈퇴",
    description="계정을 소프트 삭제하고 개인정보를 마스킹 처리한다. 복구 불가.",
    responses={204: None},
  )
  def delete(self, request):
    request.user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
