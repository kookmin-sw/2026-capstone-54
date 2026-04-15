from api.v1.resumes.serializers.resume_stats_serializer import ResumeCountStatsSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from resumes.services import ResumeCountStatsService


@extend_schema(tags=["이력서 통계"])
class ResumeCountStatsView(BaseAPIView):
  """전체/분석 중/실패/활성/비활성 개수."""
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="이력서 개수 통계", responses=ResumeCountStatsSerializer)
  def get(self, request):
    data = ResumeCountStatsService(user=self.current_user).perform()
    return Response(ResumeCountStatsSerializer(data).data)
