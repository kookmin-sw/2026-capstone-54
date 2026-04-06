from common.models import BaseModel
from django.db import models
from django.test import TestCase


class BaseTestModel(BaseModel):
  """테스트용 구체 모델"""
  name = models.CharField(max_length=100)

  class Meta(BaseModel.Meta):
    app_label = "common"


class BaseModelFieldTest(TestCase):
  """BaseModel 필드 테스트"""

  def setUp(self):
    self.obj = BaseTestModel.objects.create(name="test")

  def test_created_at_auto_set(self):
    """생성 시 created_at이 자동 설정되는지 확인"""
    self.assertIsNotNone(self.obj.created_at)

  def test_updated_at_auto_set(self):
    """생성 시 updated_at이 자동 설정되는지 확인"""
    self.assertIsNotNone(self.obj.updated_at)

  def test_updated_at_changes_on_save(self):
    """수정 시 updated_at이 갱신되는지 확인"""
    old_updated = self.obj.updated_at
    self.obj.name = "updated"
    self.obj.save()
    self.obj.refresh_from_db()
    self.assertGreaterEqual(self.obj.updated_at, old_updated)

  def test_created_at_unchanged_on_save(self):
    """수정 시 created_at은 변경되지 않는지 확인"""
    original = self.obj.created_at
    self.obj.name = "updated"
    self.obj.save()
    self.obj.refresh_from_db()
    self.assertEqual(self.obj.created_at, original)


class BaseModelOrderingTest(TestCase):
  """BaseModel 정렬 테스트"""

  def test_default_ordering_is_created_at_desc(self):
    """기본 정렬이 created_at 내림차순인지 확인"""
    obj1 = BaseTestModel.objects.create(name="first")
    obj2 = BaseTestModel.objects.create(name="second")
    items = list(BaseTestModel.objects.all())
    self.assertEqual(items[0].pk, obj2.pk)
    self.assertEqual(items[1].pk, obj1.pk)

  def test_get_latest_by(self):
    """latest()가 created_at 기준으로 동작하는지 확인"""
    BaseTestModel.objects.create(name="first")
    obj2 = BaseTestModel.objects.create(name="second")
    latest = BaseTestModel.objects.latest()
    self.assertEqual(latest.pk, obj2.pk)


class BaseModelManagerTest(TestCase):
  """BaseModel 매니저 테스트"""

  def test_create_and_retrieve(self):
    """객체 생성 및 조회가 정상 동작하는지 확인"""
    BaseTestModel.objects.create(name="test")
    self.assertEqual(BaseTestModel.objects.count(), 1)

  def test_delete(self):
    """객체 삭제가 정상 동작하는지 확인"""
    obj = BaseTestModel.objects.create(name="test")
    obj.delete()
    self.assertEqual(BaseTestModel.objects.count(), 0)
