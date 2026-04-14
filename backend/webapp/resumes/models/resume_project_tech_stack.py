"""ResumeProject ↔ TechStack N:M 경유 모델."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeProjectTechStack(BaseModelWithUUIDAndSoftDelete):
  """프로젝트에 사용된 기술 스택 한 건."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_project_tech_stacks"
    verbose_name = "이력서 프로젝트 기술 스택 매핑"
    verbose_name_plural = "이력서 프로젝트 기술 스택 매핑"
    ordering = ["display_order", "created_at"]
    constraints = [
      models.UniqueConstraint(
        fields=["resume_project", "tech_stack"],
        condition=models.Q(deleted_at__isnull=True),
        name="uniq_resume_project_tech_stack_active",
      ),
    ]

  resume_project = models.ForeignKey(
    "resumes.ResumeProject",
    on_delete=models.CASCADE,
    related_name="resume_project_tech_stacks",
  )
  tech_stack = models.ForeignKey(
    "resumes.TechStack",
    on_delete=models.CASCADE,
    related_name="resume_project_tech_stacks",
  )
  display_order = models.PositiveIntegerField(default=0)

  def __str__(self) -> str:
    return f"ResumeProjectTechStack({self.resume_project_id}→{self.tech_stack_id})"
