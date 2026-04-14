"""직업별 이력서 텍스트 템플릿. 사용자가 이력서 직접 입력 시 시작점으로 사용한다."""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeTextContentTemplate(BaseModelWithUUIDAndSoftDelete):
  """특정 Job에 대한 이력서 템플릿 샘플 텍스트.

  하나의 Job은 여러 템플릿을 가질 수 있다 (난이도/경력별 등).
  """

  job = models.ForeignKey(
    "profiles.Job",
    on_delete=models.CASCADE,
    related_name="resume_text_content_templates",
    verbose_name="직업",
  )
  title = models.CharField(
    max_length=100,
    verbose_name="템플릿 제목",
    help_text="예: '신입 프론트엔드 개발자 템플릿'",
  )
  content = models.TextField(
    verbose_name="템플릿 본문",
    help_text="사용자가 이력서 작성을 시작할 때 pre-fill 되는 텍스트",
  )
  display_order = models.IntegerField(
    default=0,
    verbose_name="표시 순서",
    help_text="같은 직업 내에서 정렬 기준",
  )

  class Meta:
    db_table = "resume_text_content_templates"
    verbose_name = "이력서 텍스트 템플릿"
    verbose_name_plural = "이력서 텍스트 템플릿"
    ordering = ["job__name", "display_order", "title"]

  def __str__(self) -> str:
    return f"{self.job.name} - {self.title}"
