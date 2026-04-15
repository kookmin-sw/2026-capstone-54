from api.v1.resumes.serializers import (
  ResumeLanguageSpokenRequestSerializer,
  ResumeLanguageSpokenResponseSerializer,
)
from drf_spectacular.utils import extend_schema
from resumes.models import ResumeLanguageSpoken
from resumes.services import (
  DeleteResumeLanguageSpokenService,
  UpsertResumeLanguageSpokenService,
)

from .resume_item_section_viewset_base import ResumeItemSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeLanguageSpokenSectionViewSet(ResumeItemSectionViewSetBase):
  """구사 언어 섹션 CRUD."""

  model = ResumeLanguageSpoken
  request_serializer = ResumeLanguageSpokenRequestSerializer
  response_serializer = ResumeLanguageSpokenResponseSerializer
  upsert_service = UpsertResumeLanguageSpokenService
  delete_service = DeleteResumeLanguageSpokenService
