"""이력서 자격증 항목 (1:N Resume)."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeCertification(BaseModelWithUUIDAndSoftDelete):
  """자격증 한 건."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_certifications"
    verbose_name = "이력서 자격증"
    verbose_name_plural = "이력서 자격증"
    ordering = ["display_order", "created_at"]
    indexes = [
      models.Index(fields=["resume", "display_order"]),
    ]

  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="certifications",
  )
  name = models.CharField(max_length=200, blank=True, default="")
  issuer = models.CharField(max_length=200, blank=True, default="")
  date = models.CharField(max_length=50, blank=True, default="")
  display_order = models.PositiveIntegerField(default=0)

  def __str__(self) -> str:
    return f"Certification({self.resume_id}): {self.name}"
