"""이력서 경력 메타 (1:1 Resume).

parsed_data 에서 도출한 경력 연차 등 수치 메타데이터를 보관한다.
"""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeCareerMeta(BaseModelWithUUIDAndSoftDelete):
  """LLM 이 판별한 총 경력 연차 등 수치 메타."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_career_metas"
    verbose_name = "이력서 경력 메타"
    verbose_name_plural = "이력서 경력 메타"

  resume = models.OneToOneField(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="career_meta",
  )
  total_experience_years = models.PositiveIntegerField(null=True, blank=True)
  total_experience_months = models.PositiveIntegerField(null=True, blank=True)

  def __str__(self) -> str:
    return (
      f"CareerMeta({self.resume_id}): "
      f"{self.total_experience_years or 0}y {self.total_experience_months or 0}m"
    )
