from api.v1.resumes.serializers import (
  ResumeExperienceRequestSerializer,
  ResumeExperienceResponseSerializer,
)
from drf_spectacular.utils import extend_schema
from resumes.models import ResumeExperience
from resumes.services import DeleteResumeExperienceService, UpsertResumeExperienceService

from .resume_item_section_viewset_base import ResumeItemSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeExperienceSectionViewSet(ResumeItemSectionViewSetBase):
  """경력 섹션 CRUD."""

  model = ResumeExperience
  request_serializer = ResumeExperienceRequestSerializer
  response_serializer = ResumeExperienceResponseSerializer
  upsert_service = UpsertResumeExperienceService
  delete_service = DeleteResumeExperienceService
