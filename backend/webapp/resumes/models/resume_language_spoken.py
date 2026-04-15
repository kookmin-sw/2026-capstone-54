"""이력서 구사 언어 항목 (1:N Resume)."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeLanguageSpoken(BaseModelWithUUIDAndSoftDelete):
  """구사 언어 한 건. parsed_data.languages_spoken 과 매핑."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_languages_spoken"
    verbose_name = "이력서 구사 언어"
    verbose_name_plural = "이력서 구사 언어"
    ordering = ["display_order", "created_at"]
    indexes = [
      models.Index(fields=["resume", "display_order"]),
    ]

  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="languages_spoken",
  )
  language = models.CharField(max_length=100, blank=True, default="")
  level = models.CharField(max_length=100, blank=True, default="")
  display_order = models.PositiveIntegerField(default=0)

  def __str__(self) -> str:
    return f"LanguageSpoken({self.resume_id}): {self.language} ({self.level})"
