from api.v1.dashboard.serializers import DashboardStatisticsSerializer
from api.v1.dashboard.services import (
  AverageInterviewScoreService,
  CurrentStreakService,
  TotalCompletedInterviewCountService,
  TotalPracticeTimeService,
)
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["대시보드"])
class DashboardStatisticsAPIView(BaseAPIView):
  permission_classes = [IsEmailVerified]
  serializer_class = DashboardStatisticsSerializer

  @extend_schema(summary="대시보드 기본 통계 조회")
  def get(self, request):
    user = self.current_user

    average_score_payload = AverageInterviewScoreService(user=user).perform()

    data = {
      "total_completed_interviews": TotalCompletedInterviewCountService(user=user).perform(),
      "average_score": average_score_payload["average_score"],
      "average_score_sample_size": average_score_payload["sample_size"],
      "current_streak_days": CurrentStreakService(user=user).perform(),
      "total_practice_time_seconds": TotalPracticeTimeService(user=user).perform(),
    }

    return Response(DashboardStatisticsSerializer(data).data, status=status.HTTP_200_OK)
