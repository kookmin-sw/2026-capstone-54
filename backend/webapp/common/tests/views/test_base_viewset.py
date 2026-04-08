from common.models import BaseModel
from common.views import BaseViewSet
from django.db import models
from django.test import TestCase
from rest_framework import serializers, status
from rest_framework.test import APIRequestFactory
from users.factories import UserFactory

factory = APIRequestFactory()


class ViewSetTestModel(BaseModel):
  """테스트용 구체 모델"""
  name = models.CharField(max_length=100)

  class Meta(BaseModel.Meta):
    app_label = "common"


class ViewSetTestSerializer(serializers.ModelSerializer):

  class Meta:
    model = ViewSetTestModel
    fields = ["id", "name"]


class DummyViewSet(BaseViewSet):
  queryset = ViewSetTestModel.objects.all()
  serializer_class = ViewSetTestSerializer


class BaseViewSetAuthTest(TestCase):
  """BaseViewSet 인증 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.list_view = DummyViewSet.as_view({"get": "list"})
    self.create_view = DummyViewSet.as_view({"post": "create"})

  def test_unauthenticated_list_returns_401_or_403(self):
    """비인증 list 요청 시 401 또는 403 반환 확인"""
    request = factory.get("/test/")
    response = self.list_view(request)
    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )

  def test_authenticated_list_returns_200(self):
    """인증된 list 요청 시 200 반환 확인"""
    request = factory.get("/test/")
    request.user = self.user
    request._dont_enforce_csrf_checks = True
    response = self.list_view(request)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_authenticated_create_returns_201(self):
    """인증된 create 요청 시 201 반환 확인"""
    request = factory.post("/test/", {"name": "new item"}, format="json")
    request.user = self.user
    request._dont_enforce_csrf_checks = True
    response = self.create_view(request)
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

  def test_unauthenticated_create_returns_401_or_403(self):
    """비인증 create 요청 시 401 또는 403 반환 확인"""
    request = factory.post("/test/", {"name": "new item"}, format="json")
    response = self.create_view(request)
    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )
