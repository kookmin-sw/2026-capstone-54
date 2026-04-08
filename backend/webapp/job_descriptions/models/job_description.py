from common.models import BaseModel
from django.db import models
from django.utils import timezone
from job_descriptions.enums import CollectionStatus


class JobDescription(BaseModel):
  """채용공고 원본 데이터. URL 기준으로 유니크하게 관리된다."""

  class Meta(BaseModel.Meta):
    db_table = "job_descriptions"
    verbose_name = "채용공고"
    verbose_name_plural = "채용공고 목록"

  # 메타 정보
  url = models.URLField(
    max_length=2048,
    unique=True,
    verbose_name="채용공고 URL",
  )
  platform = models.CharField(
    max_length=50,
    blank=True,
    default="",
    verbose_name="플랫폼명",
    help_text="saramin, jobkorea, jobplanet 등",
  )

  # 기본 정보
  company = models.CharField(
    max_length=255,
    blank=True,
    default="",
    verbose_name="회사명",
  )
  title = models.CharField(
    max_length=255,
    blank=True,
    default="",
    verbose_name="채용공고 제목",
  )

  # 공고 본문
  duties = models.TextField(
    blank=True,
    default="",
    verbose_name="담당업무",
  )
  requirements = models.TextField(
    blank=True,
    default="",
    verbose_name="지원자격 / 필수조건",
  )
  preferred = models.TextField(
    blank=True,
    default="",
    verbose_name="우대사항",
  )

  # 근무 조건
  work_type = models.CharField(
    max_length=50,
    blank=True,
    default="",
    verbose_name="고용형태",
    help_text="정규직, 계약직, 인턴 등",
  )
  salary = models.CharField(
    max_length=255,
    blank=True,
    default="",
    verbose_name="급여 정보",
  )
  location = models.CharField(
    max_length=255,
    blank=True,
    default="",
    verbose_name="근무지역",
  )
  education = models.CharField(
    max_length=100,
    blank=True,
    default="",
    verbose_name="학력 조건",
  )
  experience = models.CharField(
    max_length=100,
    blank=True,
    default="",
    verbose_name="경력 조건",
  )

  # 수집 상태
  collection_status = models.CharField(
    max_length=20,
    choices=CollectionStatus.choices,
    default=CollectionStatus.PENDING,
    verbose_name="수집 상태",
  )
  scraped_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="수집 완료 일시",
  )
  error_message = models.TextField(
    blank=True,
    default="",
    verbose_name="에러 메시지",
  )

  def __str__(self):
    return f"[{self.get_collection_status_display()}] {self.title or self.url}"

  def mark_in_progress(self):
    """수집 시작 시 호출."""
    self.collection_status = CollectionStatus.IN_PROGRESS
    self.error_message = ""
    self.save(update_fields=["collection_status", "error_message", "updated_at"])

  def mark_done(self):
    """수집 완료 시 호출."""
    self.collection_status = CollectionStatus.DONE
    self.scraped_at = timezone.now()
    self.save(update_fields=["collection_status", "scraped_at", "updated_at"])

  def mark_error(self, message: str = ""):
    """수집 실패 시 호출."""
    self.collection_status = CollectionStatus.ERROR
    self.error_message = message
    self.save(update_fields=["collection_status", "error_message", "updated_at"])
