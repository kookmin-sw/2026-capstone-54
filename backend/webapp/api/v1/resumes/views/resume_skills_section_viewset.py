from api.v1.resumes.serializers import ResumeSkillsRequestSerializer
from drf_spectacular.utils import extend_schema
from resumes.services import ReplaceResumeSkillsService

from .resume_replace_section_viewset_base import ResumeReplaceSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeSkillsSectionViewSet(ResumeReplaceSectionViewSetBase):
  """스킬 전체 교체 (4-group dict 입력)."""

  request_serializer = ResumeSkillsRequestSerializer
  replace_service = ReplaceResumeSkillsService

  def build_service_kwargs(self, validated_data: dict) -> dict:
    return {"skills": validated_data.get("skills") or {}}
