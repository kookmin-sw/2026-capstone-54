from django.db import models
from django.utils import timezone

from .base_model import BaseModel, BaseModelManager, BaseModelQuerySet


class SoftDeleteQuerySet(BaseModelQuerySet):

  def delete(self):
    return super().update(deleted_at=models.functions.Now())

  def hard_delete(self):
    return super().delete()

  def active(self):
    return self.filter(deleted_at__isnull=True)

  def deleted(self):
    return self.filter(deleted_at__isnull=False)

  def with_deleted(self):
    return self.all()

  def restore(self):
    return super().update(deleted_at=None)


class SoftDeleteManager(BaseModelManager.from_queryset(SoftDeleteQuerySet)):
  """삭제된 레코드 제외 조회용 매니저"""

  def get_queryset(self):
    return super().get_queryset().active()


class AllObjectsManager(BaseModelManager.from_queryset(SoftDeleteQuerySet)):
  """삭제된 레코드 포함 전체 조회용 매니저"""
  pass


class BaseModelWithSoftDelete(BaseModel):

  class Meta:
    abstract = True
    verbose_name = "Base Model with Soft Delete"
    verbose_name_plural = "Base Models with Soft Delete"
    indexes = [models.Index(fields=["deleted_at"])]

  objects = SoftDeleteManager()
  all_objects = AllObjectsManager()

  deleted_at = models.DateTimeField(null=True, blank=True)

  def delete(self, using=None, keep_parents=False):
    self.deleted_at = timezone.now()
    self.save(update_fields=["deleted_at", "updated_at"])

  def hard_delete(self, using=None, keep_parents=False):
    super().delete(using=using, keep_parents=keep_parents)

  def restore(self):
    self.deleted_at = None
    self.save(update_fields=["deleted_at", "updated_at"])
