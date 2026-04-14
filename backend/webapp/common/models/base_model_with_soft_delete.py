"""Soft delete base model with Collector-based cascade + selective restore.

핵심 동작:
- `delete()` 는 Django `Collector` 로 CASCADE 로 연결된 객체 그래프를 수집하되,
  SQL DELETE 대신 `deleted_at` 을 UPDATE 한다.
  - SoftDelete 상속 모델 → `deleted_at = now` bulk UPDATE
  - 일반 모델 → `_base_manager.filter(pk__in=...).delete()` (hard delete)
- `restore()` 는 `soft_restore_cascade` 에 나열된 reverse accessor 만 cascade 복구한다.
  자식의 `deleted_at` 이 **부모가 삭제된 그 시점과 동일** 한 경우에만 복구하므로,
  부모 삭제 이전에 별개로 지워진 자식은 부활하지 않는다.
"""

from django.db import models, router, transaction
from django.db.models.deletion import Collector
from django.utils import timezone

from .base_model import BaseModel, BaseModelManager, BaseModelQuerySet


def _soft_cascade_delete(instances, using=None, keep_parents=False):
  """Collector 로 수집된 그래프를 타입별로 soft/hard 분기해 처리한다.

  Django Collector 의 두 경로를 모두 처리한다:
  1. `collector.data` — 일반 수집된 instance dict (pre/post_delete 시그널이 걸린 모델 등)
  2. `collector.fast_deletes` — signal 이 없고 dependency 가 단순한 CASCADE 자식들을
     Django 가 `fast delete` 로 최적화해 넣어두는 *unevaluated queryset* 리스트.
     → 과거에는 이 리스트를 놓쳐서 cascade 가 전혀 전파되지 않았다.
  """
  if not instances:
    return timezone.now()
  now = timezone.now()
  db = using or router.db_for_write(type(instances[0]))
  with transaction.atomic(using=db):
    collector = Collector(using=db)
    collector.collect(instances, keep_parents=keep_parents)

    # 1) collector.data : {Model: [instances]}
    for model, pk_instances in collector.data.items():
      pks = [obj.pk for obj in pk_instances]
      if not pks:
        continue
      _apply_cascade(model, pks, now)

    # 2) collector.fast_deletes : list[QuerySet]
    for qs in collector.fast_deletes:
      model = qs.model
      pks = list(qs.values_list("pk", flat=True))
      if not pks:
        continue
      _apply_cascade(model, pks, now)
  return now


def _apply_cascade(model, pks, now):
  """모델 타입에 따라 soft(UPDATE deleted_at) 또는 hard(DELETE) 를 수행한다."""
  if issubclass(model, BaseModelWithSoftDelete):
    model.all_objects.filter(pk__in=pks, deleted_at__isnull=True).update(
      deleted_at=now,
      updated_at=now,
    )
  else:
    model._base_manager.filter(pk__in=pks).delete()


class SoftDeleteQuerySet(BaseModelQuerySet):

  def delete(self):
    """QuerySet.delete() 도 Collector 기반 soft-cascade 를 태운다."""
    instances = list(self)
    if not instances:
      return 0, {}
    _soft_cascade_delete(instances, using=self.db)
    return len(instances), {}

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
  """Soft delete + Collector 기반 cascade soft-delete + 선택적 restore.

  자식 모델에서 `soft_restore_cascade` 를 오버라이드해 복구 범위를 지정한다.
  리스트의 원소는 "reverse accessor name" (보통 FK 의 `related_name`).

  예시:
      class Resume(BaseModelWithUUIDAndSoftDelete):
        soft_restore_cascade = [
          "experiences", "educations", "certifications", "awards",
          "projects", "languages_spoken", "basic_info", "summary",
          "career_meta", "resume_skills", "resume_industry_domains",
          "resume_keywords",
        ]

  `restore()` 호출 시:
    1. 현재 인스턴스의 `deleted_at` 을 기억한다 (old_ts).
    2. 인스턴스를 복구한다 (deleted_at=None).
    3. `soft_restore_cascade` 의 각 accessor 에 대해,
       해당 자식 중 `deleted_at == old_ts` 인 행만 복구한다.
       → 부모와 동시에 soft-delete 된 자식만 살아나고, 이전에 별도로 삭제된
          자식은 복구되지 않는다.
  """

  #: 복구 시 cascade 대상 reverse accessor 이름 목록. 기본은 비어있음.
  soft_restore_cascade: list[str] = []

  class Meta:
    abstract = True
    verbose_name = "Base Model with Soft Delete"
    verbose_name_plural = "Base Models with Soft Delete"
    indexes = [models.Index(fields=["deleted_at"])]

  objects = SoftDeleteManager()
  all_objects = AllObjectsManager()

  deleted_at = models.DateTimeField(null=True, blank=True)

  def delete(self, using=None, keep_parents=False):
    """Collector 로 CASCADE 그래프를 모아 soft-cascade delete 를 수행한다."""
    now = _soft_cascade_delete([self], using=using, keep_parents=keep_parents)
    self.deleted_at = now

  def hard_delete(self, using=None, keep_parents=False):
    # 진짜 DB DELETE. CASCADE 도 SQL 이 아니라 Django Collector 가 처리한다.
    super().delete(using=using, keep_parents=keep_parents)

  def restore(self):
    """선언된 cascade 자식 중 "나와 같은 시점에 삭제된" 행들만 같이 복구한다."""
    if self.deleted_at is None:
      return
    old_ts = self.deleted_at
    now = timezone.now()
    with transaction.atomic():
      self.deleted_at = None
      self.save(update_fields=["deleted_at", "updated_at"])
      self._restore_cascade(old_ts=old_ts, now=now)

  def _restore_cascade(self, old_ts, now):
    """`soft_restore_cascade` 에 나열된 reverse accessor 들을 순회하며 복구한다."""
    for accessor in self.soft_restore_cascade:
      field = self._find_reverse_field(accessor)
      if field is None:
        continue
      related_model = field.related_model
      if not issubclass(related_model, BaseModelWithSoftDelete):
        continue
      fk_name = field.field.name  # 자식 쪽 FK field 이름
      filter_kwargs = {fk_name: self.pk, "deleted_at": old_ts}
      restored_qs = related_model.all_objects.filter(**filter_kwargs)
      restored_pks = list(restored_qs.values_list("pk", flat=True))
      if not restored_pks:
        continue
      related_model.all_objects.filter(pk__in=restored_pks).update(
        deleted_at=None,
        updated_at=now,
      )
      # 복구된 자식이 다시 cascade 대상이 있을 수 있으므로 재귀
      for child in related_model.all_objects.filter(pk__in=restored_pks):
        child._restore_cascade(old_ts=old_ts, now=now)

  def _find_reverse_field(self, accessor: str):
    """`get_accessor_name()` 이 주어진 이름과 일치하는 reverse 필드를 찾는다."""
    for f in self._meta.get_fields():
      if (f.one_to_many or f.one_to_one) and f.auto_created and not f.concrete:
        if f.get_accessor_name() == accessor:
          return f
    return None
