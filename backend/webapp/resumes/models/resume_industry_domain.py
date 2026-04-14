"""Resume ↔ IndustryDomain N:M 경유 모델."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeIndustryDomain(BaseModelWithUUIDAndSoftDelete):
  """이력서에 연결된 산업 도메인 한 건."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_industry_domains"
    verbose_name = "이력서 산업 도메인 매핑"
    verbose_name_plural = "이력서 산업 도메인 매핑"
    ordering = ["display_order", "created_at"]
    constraints = [
      models.UniqueConstraint(
        fields=["resume", "industry_domain"],
        condition=models.Q(deleted_at__isnull=True),
        name="uniq_resume_industry_domain_active",
      ),
    ]

  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="resume_industry_domains",
  )
  industry_domain = models.ForeignKey(
    "resumes.IndustryDomain",
    on_delete=models.CASCADE,
    related_name="resume_industry_domains",
  )
  display_order = models.PositiveIntegerField(default=0)

  def __str__(self) -> str:
    return f"ResumeIndustryDomain({self.resume_id}→{self.industry_domain_id})"
