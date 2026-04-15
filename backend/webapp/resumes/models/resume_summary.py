"""이력서 요약 (1:1 Resume)."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeSummary(BaseModelWithUUIDAndSoftDelete):
  """parsed_data.summary — 한 줄 경력 요약."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_summaries"
    verbose_name = "이력서 요약"
    verbose_name_plural = "이력서 요약"

  resume = models.OneToOneField(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="summary",
  )
  text = models.TextField(blank=True, default="")

  def __str__(self) -> str:
    return f"Summary({self.resume_id})"
