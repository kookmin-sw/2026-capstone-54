from api.v1.resumes.serializers.resume_stats_serializer import ResumeTypeStatsSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from resumes.services import ResumeTypeStatsService


@extend_schema(tags=["이력서 통계"])
class ResumeTypeStatsView(BaseAPIView):
  """파일/텍스트 타입별 개수."""
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="이력서 타입별 통계", responses=ResumeTypeStatsSerializer)
  def get(self, request):
    data = ResumeTypeStatsService(user=self.current_user).perform()
    return Response(ResumeTypeStatsSerializer(data).data)
