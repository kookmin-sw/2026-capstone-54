from common.models import BaseModel
from common.views import BaseReadOnlyViewSet
from django.db import models
from django.test import TestCase
from rest_framework import serializers, status
from rest_framework.test import APIRequestFactory, force_authenticate
from users.factories import UserFactory

factory = APIRequestFactory()


class ReadOnlyTestModel(BaseModel):
  """테스트용 구체 모델"""

  name = models.CharField(max_length=100)

  class Meta(BaseModel.Meta):
    app_label = "common"


class ReadOnlyTestSerializer(serializers.ModelSerializer):

  class Meta:
    model = ReadOnlyTestModel
    fields = ["id", "name"]


class DummyReadOnlyViewSet(BaseReadOnlyViewSet):
  queryset = ReadOnlyTestModel.objects.all()
  serializer_class = ReadOnlyTestSerializer


class BaseReadOnlyViewSetTest(TestCase):
  """BaseReadOnlyViewSet 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.obj = ReadOnlyTestModel.objects.create(name="test")
    self.list_view = DummyReadOnlyViewSet.as_view({"get": "list"})
    self.detail_view = DummyReadOnlyViewSet.as_view({"get": "retrieve"})

  def test_unauthenticated_list_returns_401_or_403(self):
    """비인증 list 요청 시 401 또는 403 반환 확인"""
    request = factory.get("/test/")
    response = self.list_view(request)
    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )

  def test_unauthenticated_retrieve_returns_401_or_403(self):
    """비인증 retrieve 요청 시 401 또는 403 반환 확인"""
    request = factory.get(f"/test/{self.obj.pk}/")
    response = self.detail_view(request, pk=self.obj.pk)
    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )

  def test_authenticated_list_returns_200(self):
    """인증된 list 요청 시 200 반환 확인"""
    request = factory.get("/test/")
    force_authenticate(request, user=self.user)
    response = self.list_view(request)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_authenticated_retrieve_returns_200(self):
    """인증된 retrieve 요청 시 200 반환 확인"""
    request = factory.get(f"/test/{self.obj.pk}/")
    force_authenticate(request, user=self.user)
    response = self.detail_view(request, pk=self.obj.pk)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_no_create_action(self):
    """POST(create) 액션이 없는지 확인"""
    self.assertFalse(hasattr(DummyReadOnlyViewSet, "create"))

  def test_no_update_action(self):
    """PUT(update) 액션이 없는지 확인"""
    self.assertFalse(hasattr(DummyReadOnlyViewSet, "update"))

  def test_no_destroy_action(self):
    """DELETE(destroy) 액션이 없는지 확인"""
    self.assertFalse(hasattr(DummyReadOnlyViewSet, "destroy"))
