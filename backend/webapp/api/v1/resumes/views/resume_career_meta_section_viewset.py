from api.v1.resumes.serializers import (
  ResumeCareerMetaRequestSerializer,
  ResumeCareerMetaResponseSerializer,
)
from drf_spectacular.utils import extend_schema
from resumes.services import UpdateResumeCareerMetaService

from .resume_singleton_section_viewset_base import ResumeSingletonSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeCareerMetaSectionViewSet(ResumeSingletonSectionViewSetBase):
  """경력 메타 upsert (years/months)."""

  request_serializer = ResumeCareerMetaRequestSerializer
  response_serializer = ResumeCareerMetaResponseSerializer
  upsert_service = UpdateResumeCareerMetaService
