from api.v1.resumes.serializers import (
  ResumeSummaryRequestSerializer,
  ResumeSummaryResponseSerializer,
)
from drf_spectacular.utils import extend_schema
from resumes.services import UpdateResumeSummaryService

from .resume_singleton_section_viewset_base import ResumeSingletonSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeSummarySectionViewSet(ResumeSingletonSectionViewSetBase):
  """요약 upsert."""

  request_serializer = ResumeSummaryRequestSerializer
  response_serializer = ResumeSummaryResponseSerializer
  upsert_service = UpdateResumeSummaryService
