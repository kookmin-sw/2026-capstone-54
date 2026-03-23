from api.v1.users.serializers import UserMeSerializer
from common.permissions import IsAuthenticated
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response


@extend_schema(tags=["사용자"])
class UserMeAPIView(BaseAPIView):
  """현재 로그인한 사용자의 정보를 조회한다."""
  permission_classes = [IsAuthenticated]
  serializer_class = UserMeSerializer

  @extend_schema(
    summary="내 정보 조회",
    responses={200: UserMeSerializer},
  )
  def get(self, request):
    serializer = UserMeSerializer(request.user)
    return Response(serializer.data)
