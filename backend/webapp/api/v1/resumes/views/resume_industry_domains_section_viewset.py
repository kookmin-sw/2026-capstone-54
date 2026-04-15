from api.v1.resumes.serializers import ResumeIndustryDomainsRequestSerializer
from drf_spectacular.utils import extend_schema
from resumes.services import ReplaceResumeIndustryDomainsService

from .resume_replace_section_viewset_base import ResumeReplaceSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeIndustryDomainsSectionViewSet(ResumeReplaceSectionViewSetBase):
  """산업 도메인 전체 교체."""

  request_serializer = ResumeIndustryDomainsRequestSerializer
  replace_service = ReplaceResumeIndustryDomainsService

  def build_service_kwargs(self, validated_data: dict) -> dict:
    return {"industry_domains": validated_data.get("industry_domains") or []}
