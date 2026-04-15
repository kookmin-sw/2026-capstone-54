from django_filters import rest_framework as filters
from resumes.models import Resume


class ResumeFilter(filters.FilterSet):
  """
  이력서 필터.

  쿼리 파라미터:
    - type: text | file | structured
    - analysis_status: pending | processing | completed | failed
    - analysis_step: queued | extracting_text | embedding | analyzing | finalizing | done
    - title: 제목 부분 검색 (contains)
  """

  title = filters.CharFilter(lookup_expr="icontains")

  class Meta:
    model = Resume
    fields = ["type", "analysis_status", "analysis_step", "title"]
