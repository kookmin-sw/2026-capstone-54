from common.models.base_model_with_soft_delete import BaseModelWithSoftDelete
from django.db import models
from django.test import TestCase


class SoftDeleteTestModel(BaseModelWithSoftDelete):
  """테스트용 구체 모델"""
  name = models.CharField(max_length=100)

  class Meta(BaseModelWithSoftDelete.Meta):
    app_label = "common"


class SoftDeleteInstanceTest(TestCase):
  """인스턴스 레벨 soft delete 테스트"""

  def setUp(self):
    self.obj = SoftDeleteTestModel.objects.create(name="test")

  def test_delete_sets_deleted_at(self):
    """delete() 호출 시 deleted_at 필드가 설정되는지 확인"""
    self.obj.delete()
    self.obj.refresh_from_db()
    self.assertIsNotNone(self.obj.deleted_at)

  def test_delete_hides_from_default_queryset(self):
    """delete() 후 기본 매니저 조회에서 제외되는지 확인"""
    self.obj.delete()
    self.assertEqual(SoftDeleteTestModel.objects.count(), 0)

  def test_delete_visible_via_all_objects(self):
    """delete() 후 all_objects 매니저로는 조회 가능한지 확인"""
    self.obj.delete()
    self.assertEqual(SoftDeleteTestModel.all_objects.count(), 1)

  def test_hard_delete_removes_from_db(self):
    """hard_delete() 호출 시 DB에서 완전히 삭제되는지 확인"""
    self.obj.hard_delete()
    self.assertEqual(SoftDeleteTestModel.all_objects.count(), 0)

  def test_restore_clears_deleted_at(self):
    """restore() 호출 시 deleted_at이 초기화되고 다시 조회되는지 확인"""
    self.obj.delete()
    self.obj.restore()
    self.obj.refresh_from_db()
    self.assertIsNone(self.obj.deleted_at)
    self.assertEqual(SoftDeleteTestModel.objects.count(), 1)


class SoftDeleteQuerySetTest(TestCase):
  """QuerySet 레벨 soft delete 테스트"""

  def setUp(self):
    self.obj1 = SoftDeleteTestModel.objects.create(name="item1")
    self.obj2 = SoftDeleteTestModel.objects.create(name="item2")
    self.obj3 = SoftDeleteTestModel.objects.create(name="item3")

  def test_queryset_delete_soft_deletes_all(self):
    """QuerySet delete() 호출 시 전체 soft delete 되는지 확인"""
    SoftDeleteTestModel.objects.all().delete()
    self.assertEqual(SoftDeleteTestModel.objects.count(), 0)
    self.assertEqual(SoftDeleteTestModel.all_objects.count(), 3)

  def test_queryset_hard_delete_removes_all(self):
    """QuerySet hard_delete() 호출 시 전체 DB 삭제되는지 확인"""
    SoftDeleteTestModel.objects.all().hard_delete()
    self.assertEqual(SoftDeleteTestModel.all_objects.count(), 0)

  def test_queryset_active_filter(self):
    """active() 필터가 삭제되지 않은 레코드만 반환하는지 확인"""
    self.obj1.delete()
    active = SoftDeleteTestModel.all_objects.active()
    self.assertEqual(active.count(), 2)

  def test_queryset_deleted_filter(self):
    """deleted() 필터가 삭제된 레코드만 반환하는지 확인"""
    self.obj1.delete()
    self.obj2.delete()
    deleted = SoftDeleteTestModel.all_objects.deleted()
    self.assertEqual(deleted.count(), 2)

  def test_queryset_with_deleted(self):
    """with_deleted()가 삭제 여부 관계없이 전체 반환하는지 확인"""
    self.obj1.delete()
    all_items = SoftDeleteTestModel.all_objects.with_deleted()
    self.assertEqual(all_items.count(), 3)

  def test_queryset_restore(self):
    """QuerySet restore() 호출 시 전체 복원되는지 확인"""
    SoftDeleteTestModel.objects.all().delete()
    SoftDeleteTestModel.all_objects.deleted().restore()
    self.assertEqual(SoftDeleteTestModel.objects.count(), 3)
