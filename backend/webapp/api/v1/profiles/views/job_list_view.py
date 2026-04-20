from api.v1.profiles.serializers import JobSerializer
from common.filters import TrigramSearchFilter
from common.views import PublicBaseListAPIView
from drf_spectacular.utils import extend_schema
from profiles.models import Job


@extend_schema(tags=["직업"])
class JobListView(PublicBaseListAPIView):
  """직군별 직업 목록 조회 뷰 (공개)"""

  serializer_class = JobSerializer
  filter_backends = [TrigramSearchFilter]
  search_fields = ["name"]
  trigram_threshold = 0.1
  trigram_limit = 10

  def get_queryset(self):
    job_category_id = self.kwargs.get("job_category_id")
    return Job.objects.opened().filter(category_id=job_category_id)

  @extend_schema(summary="직업 목록 조회 / 자동완성 검색")
  def list(self, request, *args, **kwargs):
    """직군 내 직업 목록 조회. ?search= 입력 시 유사도 기반 자동완성"""
    return super().list(request, *args, **kwargs)
