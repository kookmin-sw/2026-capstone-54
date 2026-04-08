from api.v1.streaks.filters import StreakLogFilter
from api.v1.streaks.serializers import StreakLogSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from django.utils import timezone
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from streaks.models import StreakLog


@extend_schema(tags=["스트릭"])
class StreakLogsAPIView(BaseAPIView):
  """스트릭 로그를 기간(start_date~end_date)으로 조회한다."""

  permission_classes = [IsEmailVerified]
  serializer_class = StreakLogSerializer
  filter_backends = [filters.DjangoFilterBackend]
  filterset_class = StreakLogFilter

  @extend_schema(summary="스트릭 로그 기간 조회")
  def get(self, request):
    queryset = StreakLog.objects.filter(user=self.current_user)
    queryset = self.filter_queryset(queryset)
    queryset = queryset.order_by("date")

    # 필터링된 날짜 범위 추출 (응답에 포함하기 위해)
    start_date = self._get_filtered_start_date(request)
    end_date = self._get_filtered_end_date(request)

    return Response(
      {
        "start_date": start_date,
        "end_date": end_date,
        "logs": StreakLogSerializer(queryset, many=True).data,
      },
      status=status.HTTP_200_OK,
    )

  def _get_filtered_start_date(self, request):
    """필터링에 사용된 시작일 반환 (기본값: 이번 달 1일)"""
    start_date = request.query_params.get("start_date")
    if start_date:
      return start_date
    return str(timezone.localdate().replace(day=1))

  def _get_filtered_end_date(self, request):
    """필터링에 사용된 종료일 반환 (기본값: 오늘)"""
    end_date = request.query_params.get("end_date")
    if end_date:
      return end_date
    return str(timezone.localdate())
