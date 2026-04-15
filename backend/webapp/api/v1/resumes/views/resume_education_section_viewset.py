from api.v1.resumes.serializers import (
  ResumeEducationRequestSerializer,
  ResumeEducationResponseSerializer,
)
from drf_spectacular.utils import extend_schema
from resumes.models import ResumeEducation
from resumes.services import DeleteResumeEducationService, UpsertResumeEducationService

from .resume_item_section_viewset_base import ResumeItemSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeEducationSectionViewSet(ResumeItemSectionViewSetBase):
  """학력 섹션 CRUD."""

  model = ResumeEducation
  request_serializer = ResumeEducationRequestSerializer
  response_serializer = ResumeEducationResponseSerializer
  upsert_service = UpsertResumeEducationService
  delete_service = DeleteResumeEducationService
