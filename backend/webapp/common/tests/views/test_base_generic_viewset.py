from common.views import BaseGenericViewSet
from django.test import TestCase
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory
from users.factories import UserFactory

factory = APIRequestFactory()


class DummyGenericViewSet(BaseGenericViewSet):
  """테스트용 커스텀 액션 ViewSet"""

  @action(detail=False, methods=["get"])
  def ping(self, request):
    return Response({"message": "pong"})


class BaseGenericViewSetAuthTest(TestCase):
  """BaseGenericViewSet 인증 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.ping_view = DummyGenericViewSet.as_view({"get": "ping"})

  def test_unauthenticated_request_returns_401_or_403(self):
    """비인증 요청 시 401 또는 403 반환 확인"""
    request = factory.get("/test/ping/")
    response = self.ping_view(request)
    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )

  def test_authenticated_request_returns_200(self):
    """인증된 요청 시 200 반환 확인"""
    request = factory.get("/test/ping/")
    request.user = self.user
    request._dont_enforce_csrf_checks = True
    response = self.ping_view(request)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["message"], "pong")
