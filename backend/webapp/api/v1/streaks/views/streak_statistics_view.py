from api.v1.streaks.serializers import StreakStatisticSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from streaks.models import StreakStatistics


@extend_schema(tags=["스트릭"])
class StreakStatisticsAPIView(BaseAPIView):
  """스트릭 통계(StreakStatistics) 정보를 조회한다."""

  permission_classes = [IsEmailVerified]
  serializer_class = StreakStatisticSerializer

  @extend_schema(summary="스트릭 통계 조회")
  def get(self, request):
    stats, _ = StreakStatistics.objects.get_or_create(user=self.current_user)
    return Response(StreakStatisticSerializer(stats).data, status=status.HTTP_200_OK)
