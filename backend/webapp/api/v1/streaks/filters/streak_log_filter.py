from django import forms
from django_filters import rest_framework as filters
from streaks.models import StreakLog


class StreakLogFilterForm(forms.Form):
  """StreakLogFilter의 커스텀 폼"""

  def clean(self):
    """날짜 범위 교차 검증"""
    cleaned_data = super().clean()
    start_date = cleaned_data.get('start_date')
    end_date = cleaned_data.get('end_date')

    if start_date and end_date and start_date > end_date:
      raise forms.ValidationError("start_date는 end_date보다 이전이어야 합니다.")

    return cleaned_data


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
    form = StreakLogFilterForm
