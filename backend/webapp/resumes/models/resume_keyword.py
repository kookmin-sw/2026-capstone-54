"""Resume ↔ Keyword N:M 경유 모델."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeKeyword(BaseModelWithUUIDAndSoftDelete):
  """이력서에 연결된 키워드 한 건."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_keywords"
    verbose_name = "이력서 키워드 매핑"
    verbose_name_plural = "이력서 키워드 매핑"
    ordering = ["display_order", "created_at"]
    constraints = [
      models.UniqueConstraint(
        fields=["resume", "keyword"],
        condition=models.Q(deleted_at__isnull=True),
        name="uniq_resume_keyword_active",
      ),
    ]

  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="resume_keywords",
  )
  keyword = models.ForeignKey(
    "resumes.Keyword",
    on_delete=models.CASCADE,
    related_name="resume_keywords",
  )
  display_order = models.PositiveIntegerField(default=0)

  def __str__(self) -> str:
    return f"ResumeKeyword({self.resume_id}→{self.keyword_id})"
