import uuid

from common.models import BaseModelWithUUID
from django.db import models
from django.test import TestCase


class UUIDTestModel(BaseModelWithUUID):
  """테스트용 구체 모델"""
  name = models.CharField(max_length=100)

  class Meta(BaseModelWithUUID.Meta):
    app_label = "common"


class UUIDModelFieldTest(TestCase):
  """UUID 모델 필드 테스트"""

  def setUp(self):
    self.obj = UUIDTestModel.objects.create(name="test")

  def test_pk_is_uuid(self):
    """PK가 UUID 타입인지 확인"""
    self.assertIsInstance(self.obj.pk, uuid.UUID)

  def test_uuid_auto_generated(self):
    """UUID가 자동 생성되는지 확인"""
    self.assertIsNotNone(self.obj.uuid)

  def test_uuid_is_unique_per_instance(self):
    """각 인스턴스마다 고유한 UUID가 생성되는지 확인"""
    obj2 = UUIDTestModel.objects.create(name="test2")
    self.assertNotEqual(self.obj.uuid, obj2.uuid)

  def test_uuid_not_editable(self):
    """UUID 필드가 editable=False인지 확인"""
    field = UUIDTestModel._meta.get_field("uuid")
    self.assertFalse(field.editable)

  def test_inherits_created_at(self):
    """BaseModel의 created_at 필드를 상속받는지 확인"""
    self.assertIsNotNone(self.obj.created_at)

  def test_inherits_updated_at(self):
    """BaseModel의 updated_at 필드를 상속받는지 확인"""
    self.assertIsNotNone(self.obj.updated_at)
