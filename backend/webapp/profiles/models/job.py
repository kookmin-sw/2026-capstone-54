from common.models.base_model_with_soft_delete import (
  AllObjectsManager,
  BaseModelWithSoftDelete,
  SoftDeleteManager,
  SoftDeleteQuerySet,
)
from django.db import models


class JobQuerySet(SoftDeleteQuerySet):
  """Job QuerySet"""

  def opened(self):
    """오픈된 직업만 조회"""
    return self.filter(opened_at__isnull=False)

  def closed(self):
    """닫힌 직업만 조회"""
    return self.filter(opened_at__isnull=True)


class JobManager(SoftDeleteManager.from_queryset(JobQuerySet)):
  """Job Manager - 삭제되지 않은 레코드만 반환"""
  pass


class JobAllObjectsManager(AllObjectsManager.from_queryset(JobQuerySet)):
  """Job All Objects Manager - 삭제된 레코드 포함 전체 반환"""
  pass


class Job(BaseModelWithSoftDelete):
  """직업 정보"""

  class Meta:
    db_table = "jobs"
    verbose_name = "Job"
    verbose_name_plural = "Jobs"
    ordering = ["name"]
    indexes = [
      models.Index(fields=["category", "name"]),
    ]

  name = models.CharField(max_length=100)
  category = models.ForeignKey("JobCategory", on_delete=models.CASCADE, related_name="jobs")
  opened_at = models.DateTimeField(null=True, blank=True, verbose_name="오픈 일시", help_text="사용자에게 공개된 시간")

  objects = JobManager()
  all_objects = JobAllObjectsManager()

  def __str__(self):
    return f"{self.name} ({self.category.name})"

  @property
  def is_opened(self):
    """오픈 여부"""
    return self.opened_at is not None
