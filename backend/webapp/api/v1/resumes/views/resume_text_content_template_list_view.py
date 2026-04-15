from api.v1.resumes.serializers.resume_text_content_template_list_serializer import (
  ResumeTextContentTemplateListSerializer,
)
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from resumes.models import ResumeTextContentTemplate


@extend_schema(tags=["이력서 템플릿"])
class ResumeTextContentTemplateListView(BaseAPIView):
  """직업별 이력서 텍스트 템플릿 목록.

  쿼리 파라미터:
  - job: Job UUID (옵션)
  - category: JobCategory 이름 (옵션)
  """
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="이력서 텍스트 템플릿 목록")
  def get(self, request):
    qs = ResumeTextContentTemplate.objects.select_related("job", "job__category").all()

    job_id = request.query_params.get("job")
    if job_id:
      qs = qs.filter(job_id=job_id)

    category = request.query_params.get("category")
    if category:
      qs = qs.filter(job__category__name=category)

    qs = qs.order_by("job__category__name", "job__name", "display_order", "title")
    serializer = ResumeTextContentTemplateListSerializer(qs, many=True)
    return Response(serializer.data)
