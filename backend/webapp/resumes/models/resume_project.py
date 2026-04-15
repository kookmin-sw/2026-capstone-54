"""이력서 프로젝트 항목 (1:N Resume + N:M TechStack)."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeProject(BaseModelWithUUIDAndSoftDelete):
  """프로젝트 한 건. 기술 스택은 N:M 으로 TechStack 공용 참조 테이블과 연결된다."""

  # 프로젝트를 복구하면 M2M 경유 테이블(ResumeProjectTechStack) 도 함께 복구한다.
  soft_restore_cascade = ["resume_project_tech_stacks"]

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_projects"
    verbose_name = "이력서 프로젝트"
    verbose_name_plural = "이력서 프로젝트"
    ordering = ["display_order", "created_at"]
    indexes = [
      models.Index(fields=["resume", "display_order"]),
    ]

  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="projects",
  )
  name = models.CharField(max_length=200, blank=True, default="")
  role = models.CharField(max_length=100, blank=True, default="")
  period = models.CharField(max_length=100, blank=True, default="")
  description = models.TextField(blank=True, default="")
  display_order = models.PositiveIntegerField(default=0)

  tech_stacks = models.ManyToManyField(
    "resumes.TechStack",
    through="resumes.ResumeProjectTechStack",
    related_name="resume_projects",
  )

  def __str__(self) -> str:
    return f"Project({self.resume_id}): {self.name}"
