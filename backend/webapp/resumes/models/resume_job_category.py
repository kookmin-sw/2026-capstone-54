"""이력서 직군 분류. parsed_data에서 추출된 직군 텍스트를 정규화 저장한다."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeJobCategory(BaseModelWithUUIDAndSoftDelete):
  """이력서에서 감지된 직군 분류 (IT, Marketing, Design, Finance 등).

  analysis-resume 분석 결과의 job_category 값이 여기에 저장되며,
  이미 존재하는 이름이면 재사용하고 없으면 신규 생성한다.
  """

  name = models.CharField(
    max_length=100,
    unique=True,
    verbose_name="분류명",
    help_text="IT, 마케팅, 디자인, 금융 등의 대분류",
  )
  emoji = models.CharField(
    max_length=10,
    blank=True,
    default="",
    verbose_name="이모지",
  )
  description = models.TextField(
    blank=True,
    default="",
    verbose_name="설명",
  )

  class Meta:
    db_table = "resume_job_categories"
    verbose_name = "이력서 직군 분류"
    verbose_name_plural = "이력서 직군 분류"
    ordering = ["name"]

  def __str__(self) -> str:
    return f"{self.emoji} {self.name}" if self.emoji else self.name

  @classmethod
  def get_or_create_from_text(cls, name: str) -> "ResumeJobCategory":
    """parsed_data에서 받은 직군 텍스트로 분류를 가져오거나 생성한다."""
    if not name or not name.strip():
      return None  # type: ignore
    normalized = name.strip()
    instance, _ = cls.objects.get_or_create(name=normalized)
    return instance
