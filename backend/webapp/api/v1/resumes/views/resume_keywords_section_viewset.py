from api.v1.resumes.serializers import ResumeKeywordsRequestSerializer
from drf_spectacular.utils import extend_schema
from resumes.services import ReplaceResumeKeywordsService

from .resume_replace_section_viewset_base import ResumeReplaceSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeKeywordsSectionViewSet(ResumeReplaceSectionViewSetBase):
  """키워드 전체 교체."""

  request_serializer = ResumeKeywordsRequestSerializer
  replace_service = ReplaceResumeKeywordsService

  def build_service_kwargs(self, validated_data: dict) -> dict:
    return {"keywords": validated_data.get("keywords") or []}
