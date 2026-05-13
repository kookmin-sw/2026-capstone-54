from common.models import BaseModelWithUUID
from django.conf import settings
from django.db import models
from job_descriptions.enums import ApplicationStatus


class UserJobDescription(BaseModelWithUUID):
  """사용자가 채용공고를 등록한 레코드. unique 제약 없이 동일 공고를 여러번 등록 가능."""

  class Meta(BaseModelWithUUID.Meta):
    db_table = "user_job_descriptions"
    verbose_name = "사용자 채용공고"
    verbose_name_plural = "사용자 채용공고 목록"

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="user_job_descriptions",
    verbose_name="사용자",
  )
  job_description = models.ForeignKey(
    "job_descriptions.JobDescription",
    on_delete=models.CASCADE,
    related_name="user_job_descriptions",
    verbose_name="채용공고",
  )
  title = models.CharField(
    max_length=255,
    blank=True,
    default="",
    verbose_name="내 식별 제목",
    help_text="사용자가 직접 지은 채용공고 식별 제목",
  )
  application_status = models.CharField(
    max_length=20,
    choices=ApplicationStatus.choices,
    default=ApplicationStatus.PLANNED,
    verbose_name="지원 상태",
  )

  def __str__(self):
    return f"{self.user} → {self.job_description} ({self.get_application_status_display()})"
