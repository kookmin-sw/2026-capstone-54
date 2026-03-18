from api.v1.health_check.serializers import HealthCheckSerializer
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response


class HealthCheckAPIView(BaseAPIView):
  """서버 상태 확인용 헬스체크 API"""
  permission_classes = []

  @extend_schema(
    summary="Health Check",
    responses=HealthCheckSerializer,
  )
  def get(self, _request):
    """서버가 정상 동작 중인지 확인한다."""
    return Response({"status": "ok"})
