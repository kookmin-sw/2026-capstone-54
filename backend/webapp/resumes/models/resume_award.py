"""이력서 수상 이력 항목 (1:N Resume)."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeAward(BaseModelWithUUIDAndSoftDelete):
  """수상 이력 한 건."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_awards"
    verbose_name = "이력서 수상 이력"
    verbose_name_plural = "이력서 수상 이력"
    ordering = ["display_order", "created_at"]
    indexes = [
      models.Index(fields=["resume", "display_order"]),
    ]

  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="awards",
  )
  name = models.CharField(max_length=200, blank=True, default="")
  year = models.CharField(max_length=20, blank=True, default="")
  organization = models.CharField(max_length=200, blank=True, default="")
  description = models.TextField(blank=True, default="")
  display_order = models.PositiveIntegerField(default=0)

  def __str__(self) -> str:
    return f"Award({self.resume_id}): {self.name}"
