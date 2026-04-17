from api.v1.resumes.serializers.resume_text_content_template_list_serializer import (
  ResumeTextContentTemplateListSerializer,
)
from common.filters import TrigramSearchFilter
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.response import Response
from resumes.models import ResumeTextContentTemplate


@extend_schema(tags=["이력서 템플릿"])
class ResumeTextContentTemplateListView(BaseAPIView):
  """직업별 이력서 텍스트 템플릿 목록.

  쿼리 파라미터:
  - job: Job UUID (옵션)
  - category: JobCategory 이름 (옵션)
  - search: 템플릿 제목 유사도 검색 (옵션, pg_trgm 기반)
  """

  permission_classes = [IsEmailVerified]

  # ?search=<q> 는 title 필드에 TrigramSimilarity 기반 유사도 매칭 + 유사도 순 정렬.
  # SearchFilter 서브클래스라 drf-spectacular 가 자동으로 ?search 파라미터를 문서화한다.
  filter_backends = [TrigramSearchFilter]
  search_fields = ["title"]
  trigram_threshold = 0.1

  @extend_schema(
    summary="이력서 텍스트 템플릿 목록",
    # `search` 파라미터는 SearchFilter 가 filter_backends 에 등록되어 있어
    # drf-spectacular 가 자동으로 스키마에 추가한다. 여기서 수동 선언하지 않는다.
    parameters=[
      OpenApiParameter(name="job", description="Job UUID", required=False, type=str),
      OpenApiParameter(name="category", description="JobCategory 이름", required=False, type=str),
    ],
  )
  def get(self, request):
    qs = ResumeTextContentTemplate.objects.select_related("job", "job__category").all()

    job_id = request.query_params.get("job")
    if job_id:
      qs = qs.filter(job_id=job_id)

    category = request.query_params.get("category")
    if category:
      qs = qs.filter(job__category__name=category)

    # ?search=<q> 처리. TrigramSearchFilter 가 유사도 annotate + -similarity 정렬을 수행.
    # BaseAPIView 의 get(self, request) 는 filter_queryset 을 자동 호출하지 않으므로 명시 호출.
    for backend in (b() for b in self.filter_backends):
      qs = backend.filter_queryset(request, qs, self)

    # search 가 있을 때는 trigram 의 유사도 순서를 유지. 없을 때만 기본 사전식 정렬을 적용.
    if not request.query_params.get("search"):
      qs = qs.order_by("job__category__name", "job__name", "display_order", "title")

    serializer = ResumeTextContentTemplateListSerializer(qs, many=True)
    return Response(serializer.data)
