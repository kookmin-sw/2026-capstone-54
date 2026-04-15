from api.v1.resumes.serializers import (
  ResumeBasicInfoRequestSerializer,
  ResumeBasicInfoResponseSerializer,
)
from drf_spectacular.utils import extend_schema
from resumes.services import UpdateResumeBasicInfoService

from .resume_singleton_section_viewset_base import ResumeSingletonSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeBasicInfoSectionViewSet(ResumeSingletonSectionViewSetBase):
  """기본 정보 upsert."""

  request_serializer = ResumeBasicInfoRequestSerializer
  response_serializer = ResumeBasicInfoResponseSerializer
  upsert_service = UpdateResumeBasicInfoService
