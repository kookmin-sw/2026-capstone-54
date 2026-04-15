from api.v1.resumes.serializers import (
  ResumeCertificationRequestSerializer,
  ResumeCertificationResponseSerializer,
)
from drf_spectacular.utils import extend_schema
from resumes.models import ResumeCertification
from resumes.services import DeleteResumeCertificationService, UpsertResumeCertificationService

from .resume_item_section_viewset_base import ResumeItemSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeCertificationSectionViewSet(ResumeItemSectionViewSetBase):
  """자격증 섹션 CRUD."""

  model = ResumeCertification
  request_serializer = ResumeCertificationRequestSerializer
  response_serializer = ResumeCertificationResponseSerializer
  upsert_service = UpsertResumeCertificationService
  delete_service = DeleteResumeCertificationService
