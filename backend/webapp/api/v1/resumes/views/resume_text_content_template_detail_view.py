from api.v1.resumes.serializers.resume_text_content_template_detail_serializer import (
  ResumeTextContentTemplateDetailSerializer,
)
from common.exceptions import NotFoundException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from resumes.models import ResumeTextContentTemplate


@extend_schema(tags=["이력서 템플릿"])
class ResumeTextContentTemplateDetailView(BaseAPIView):
  """이력서 텍스트 템플릿 상세."""
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="이력서 텍스트 템플릿 상세")
  def get(self, request, uuid: str):
    try:
      template = ResumeTextContentTemplate.objects.select_related("job", "job__category").get(uuid=uuid)
    except ResumeTextContentTemplate.DoesNotExist:
      raise NotFoundException("템플릿을 찾을 수 없습니다.")
    serializer = ResumeTextContentTemplateDetailSerializer(template)
    return Response(serializer.data)
