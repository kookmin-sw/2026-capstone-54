from common.views import BaseAPIView
from django.test import TestCase
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate
from users.factories import UserFactory

factory = APIRequestFactory()


class DummyAPIView(BaseAPIView):
  """테스트용 뷰"""

  def get(self, request, *args, **kwargs):
    return Response({"user": str(self.current_user)})


class BaseAPIViewAuthTest(TestCase):
  """BaseAPIView 인증 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.view = DummyAPIView.as_view()

  def test_unauthenticated_request_returns_401_or_403(self):
    """비인증 요청 시 401 또는 403 반환 확인"""
    request = factory.get("/test/")
    response = self.view(request)
    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )

  def test_authenticated_request_returns_200(self):
    """인증된 요청 시 200 반환 확인"""
    request = factory.get("/test/")
    force_authenticate(request, user=self.user)
    response = self.view(request)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_current_user_returns_request_user(self):
    """current_user 프로퍼티가 request.user를 반환하는지 확인"""
    request = factory.get("/test/")
    force_authenticate(request, user=self.user)
    response = self.view(request)
    self.assertEqual(response.data["user"], str(self.user))
