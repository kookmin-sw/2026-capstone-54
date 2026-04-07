from common.models import AllObjectsManager, BaseModelWithSoftDelete, SoftDeleteManager, SoftDeleteQuerySet
from django.db import models


class JobCategoryQuerySet(SoftDeleteQuerySet):
  """JobCategory QuerySet"""

  def opened(self):
    """오픈된 직군만 조회"""
    return self.filter(opened_at__isnull=False)

  def closed(self):
    """닫힌 직군만 조회"""
    return self.filter(opened_at__isnull=True)


class JobCategoryManager(SoftDeleteManager.from_queryset(JobCategoryQuerySet)):
  """JobCategory Manager - 삭제되지 않은 레코드만 반환"""
  pass


class JobCategoryAllObjectsManager(AllObjectsManager.from_queryset(JobCategoryQuerySet)):
  """JobCategory All Objects Manager - 삭제된 레코드 포함 전체 반환"""
  pass


class JobCategory(BaseModelWithSoftDelete):
  """직군 정보"""

  class Meta:
    db_table = "job_categories"
    verbose_name = "Job Category"
    verbose_name_plural = "Job Categories"
    ordering = ["name"]
    constraints = [
      models.UniqueConstraint(
        fields=["name"], condition=models.Q(deleted_at__isnull=True), name="unique_job_category_name_when_not_deleted"
      )
    ]

  emoji = models.CharField(max_length=10)
  name = models.CharField(max_length=100)
  opened_at = models.DateTimeField(null=True, blank=True, verbose_name="오픈 일시", help_text="사용자에게 공개된 시간")

  objects = JobCategoryManager()
  all_objects = JobCategoryAllObjectsManager()

  def __str__(self):
    return f"{self.emoji} {self.name}"

  @property
  def is_opened(self):
    """오픈 여부"""
    return self.opened_at is not None
