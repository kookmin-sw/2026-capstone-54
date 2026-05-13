from api.v1.profiles.serializers import JobCategorySerializer
from common.views import PublicBaseReadOnlyViewSet
from drf_spectacular.utils import extend_schema
from profiles.models import JobCategory


@extend_schema(tags=["직군"])
class JobCategoryViewSet(PublicBaseReadOnlyViewSet):
  """직군 목록 조회 ViewSet (공개)"""

  serializer_class = JobCategorySerializer
  queryset = JobCategory.objects.opened()

  @extend_schema(summary="직군 목록 조회")
  def list(self, request, *args, **kwargs):
    """직군 목록 조회"""
    return super().list(request, *args, **kwargs)
