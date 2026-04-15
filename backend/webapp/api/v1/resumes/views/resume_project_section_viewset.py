from api.v1.resumes.serializers import (
  ResumeProjectRequestSerializer,
  ResumeProjectResponseSerializer,
)
from drf_spectacular.utils import extend_schema
from resumes.models import ResumeProject
from resumes.services import DeleteResumeProjectService, UpsertResumeProjectService

from .resume_item_section_viewset_base import ResumeItemSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeProjectSectionViewSet(ResumeItemSectionViewSetBase):
  """프로젝트 섹션 CRUD. tech_stacks prefetch 를 list 쿼리셋에 추가한다."""

  model = ResumeProject
  request_serializer = ResumeProjectRequestSerializer
  response_serializer = ResumeProjectResponseSerializer
  upsert_service = UpsertResumeProjectService
  delete_service = DeleteResumeProjectService

  def get_queryset(self):
    return (
      ResumeProject.objects.filter(resume=self.get_resume()).prefetch_related("resume_project_tech_stacks__tech_stack")
    )
