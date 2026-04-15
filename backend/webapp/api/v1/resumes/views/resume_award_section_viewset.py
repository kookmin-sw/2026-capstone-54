from api.v1.resumes.serializers import (
  ResumeAwardRequestSerializer,
  ResumeAwardResponseSerializer,
)
from drf_spectacular.utils import extend_schema
from resumes.models import ResumeAward
from resumes.services import DeleteResumeAwardService, UpsertResumeAwardService

from .resume_item_section_viewset_base import ResumeItemSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeAwardSectionViewSet(ResumeItemSectionViewSetBase):
  """수상 이력 섹션 CRUD."""

  model = ResumeAward
  request_serializer = ResumeAwardRequestSerializer
  response_serializer = ResumeAwardResponseSerializer
  upsert_service = UpsertResumeAwardService
  delete_service = DeleteResumeAwardService
