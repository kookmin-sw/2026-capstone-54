"""이력서 경력 항목 (1:N Resume).

responsibilities / highlights 는 Postgres ArrayField 로 보관한다.
추후 항목 단위 수정 요구가 생기면 별도 테이블로 분리 고려.
"""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.contrib.postgres.fields import ArrayField
from django.db import models


class ResumeExperience(BaseModelWithUUIDAndSoftDelete):
  """회사 단위 경력 한 건."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_experiences"
    verbose_name = "이력서 경력"
    verbose_name_plural = "이력서 경력"
    ordering = ["display_order", "created_at"]
    indexes = [
      models.Index(fields=["resume", "display_order"]),
    ]

  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="experiences",
  )
  company = models.CharField(max_length=200, blank=True, default="")
  role = models.CharField(max_length=200, blank=True, default="")
  period = models.CharField(max_length=100, blank=True, default="")
  responsibilities = ArrayField(
    base_field=models.TextField(),
    default=list,
    blank=True,
  )
  highlights = ArrayField(
    base_field=models.TextField(),
    default=list,
    blank=True,
  )
  display_order = models.PositiveIntegerField(default=0)

  def __str__(self) -> str:
    return f"Experience({self.resume_id}): {self.company} / {self.role}"
