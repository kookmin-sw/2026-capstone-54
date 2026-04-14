"""이력서 학력 항목 (1:N Resume)."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeEducation(BaseModelWithUUIDAndSoftDelete):
  """학력 한 건."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_educations"
    verbose_name = "이력서 학력"
    verbose_name_plural = "이력서 학력"
    ordering = ["display_order", "created_at"]
    indexes = [
      models.Index(fields=["resume", "display_order"]),
    ]

  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="educations",
  )
  school = models.CharField(max_length=200, blank=True, default="")
  degree = models.CharField(max_length=100, blank=True, default="")
  major = models.CharField(max_length=200, blank=True, default="")
  period = models.CharField(max_length=100, blank=True, default="")
  display_order = models.PositiveIntegerField(default=0)

  def __str__(self) -> str:
    return f"Education({self.resume_id}): {self.school}"
