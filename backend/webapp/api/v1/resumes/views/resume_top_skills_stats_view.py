from api.v1.resumes.serializers.resume_stats_serializer import ResumeTopSkillsStatsSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from resumes.services import ResumeTopSkillsStatsService


@extend_schema(tags=["이력서 통계"])
class ResumeTopSkillsStatsView(BaseAPIView):
  """자주 등장하는 스킬 Top N."""
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="이력서 주요 스킬 통계", responses=ResumeTopSkillsStatsSerializer)
  def get(self, request):
    limit = int(request.query_params.get("limit", 5))
    data = ResumeTopSkillsStatsService(user=self.current_user, limit=limit).perform()
    return Response(ResumeTopSkillsStatsSerializer(data).data)
