from api.v1.resumes.serializers.resume_text_content_template_list_serializer import (
  ResumeTextContentTemplateListSerializer,
)
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from resumes.models import ResumeTextContentTemplate


@extend_schema(tags=["이력서 템플릿"])
class ResumeTextContentTemplateListView(BaseAPIView):
  """직업별 이력서 텍스트 템플릿 목록.

  쿼리 파라미터:
  - job: Job UUID (옵션)
  - category: JobCategory 이름 (옵션)
  - search: 템플릿 제목 부분 일치 검색 (옵션)
  """

  permission_classes = [IsEmailVerified]

  # DRF SearchFilter 가 ?search=<q> 를 읽어 title 필드에 icontains 를 적용한다.
  filter_backends = [SearchFilter]
  search_fields = ["title"]

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

    # ?search=<q> 처리 — SearchFilter 가 search_fields 의 필드에 대해 OR icontains 매칭.
    # BaseAPIView 는 GenericAPIView 가 아니라 backend 를 자동 적용하지 않으므로 명시 호출.
    for backend in (b() for b in self.filter_backends):
      qs = backend.filter_queryset(request, qs, self)

    qs = qs.order_by("job__category__name", "job__name", "display_order", "title")
    serializer = ResumeTextContentTemplateListSerializer(qs, many=True)
    return Response(serializer.data)
