from common.models import BaseModelWithUUID
from django.conf import settings
from django.db import models


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

  def __str__(self):
    return f"{self.user} → {self.job_description}"
