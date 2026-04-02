from django_filters import rest_framework as filters
from streaks.models import StreakLog


class StreakLogFilter(filters.FilterSet):
  """
  StreakLog 날짜 범위 필터

  쿼리 파라미터:
    - start_date: 시작일 (YYYY-MM-DD)
    - end_date: 종료일 (YYYY-MM-DD)

  사용 예시:
    ?start_date=2025-01-01&end_date=2025-01-31
  """

  start_date = filters.DateFilter(field_name='date', lookup_expr='gte')
  end_date = filters.DateFilter(field_name='date', lookup_expr='lte')

  class Meta:
    model = StreakLog
    fields = ['start_date', 'end_date']
