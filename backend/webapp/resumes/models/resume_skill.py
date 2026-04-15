"""Resume ↔ Skill N:M 경유 모델."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeSkill(BaseModelWithUUIDAndSoftDelete):
  """이력서에 연결된 스킬 한 건."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_skills"
    verbose_name = "이력서 스킬 매핑"
    verbose_name_plural = "이력서 스킬 매핑"
    ordering = ["display_order", "created_at"]
    constraints = [
      models.UniqueConstraint(
        fields=["resume", "skill"],
        condition=models.Q(deleted_at__isnull=True),
        name="uniq_resume_skill_active",
      ),
    ]
    indexes = [
      models.Index(fields=["resume", "display_order"]),
    ]

  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="resume_skills",
  )
  skill = models.ForeignKey(
    "resumes.Skill",
    on_delete=models.CASCADE,
    related_name="resume_skills",
  )
  display_order = models.PositiveIntegerField(default=0)

  def __str__(self) -> str:
    return f"ResumeSkill({self.resume_id}→{self.skill_id})"
