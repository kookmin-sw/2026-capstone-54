"""이력서 기본 정보 (1:1 Resume).

parsed_data.basic_info 섹션을 정규화해 저장한다. 부분 수정이 가능하도록 별도 테이블로 분리.
"""

from common.models import BaseModelWithUUIDAndSoftDelete
from django.db import models


class ResumeBasicInfo(BaseModelWithUUIDAndSoftDelete):
  """이력서 기본 인적사항 (이름/이메일/전화/지역)."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resume_basic_infos"
    verbose_name = "이력서 기본 정보"
    verbose_name_plural = "이력서 기본 정보"

  resume = models.OneToOneField(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="basic_info",
  )
  name = models.CharField(max_length=100, blank=True, default="")
  email = models.EmailField(blank=True, default="")
  phone = models.CharField(max_length=50, blank=True, default="")
  location = models.CharField(max_length=200, blank=True, default="")

  def __str__(self) -> str:
    return f"BasicInfo({self.resume_id}): {self.name}"
