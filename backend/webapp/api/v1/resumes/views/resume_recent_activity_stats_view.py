from api.v1.resumes.serializers.resume_stats_serializer import ResumeRecentActivityStatsSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from resumes.services import ResumeRecentActivityStatsService


@extend_schema(tags=["이력서 통계"])
class ResumeRecentActivityStatsView(BaseAPIView):
  """최근 N일 내 분석 완료된 이력서 수."""
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="이력서 최근 활동 통계", responses=ResumeRecentActivityStatsSerializer)
  def get(self, request):
    days = int(request.query_params.get("days", 7))
    data = ResumeRecentActivityStatsService(user=self.current_user, days=days).perform()
    return Response(ResumeRecentActivityStatsSerializer(data).data)
