from api.v1.health_check.views.health_check_api_view import HealthCheckAPIView
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class HealthCheckAPIViewTests(APITestCase):
  """헬스체크 API 테스트"""

  def setUp(self):
    self.url = reverse("health-check")

  def test_health_check_returns_ok_status(self):
    """GET 요청 시 200과 status: ok를 반환하는지 확인"""
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.json(), {"status": "ok"})

  def test_health_check_allows_anonymous_access(self):
    """비인증 사용자도 접근 가능한지 확인"""
    from rest_framework.permissions import AllowAny
    self.assertEqual(HealthCheckAPIView.permission_classes, [AllowAny])

  def test_health_check_only_allows_get(self):
    """GET 외 메서드는 405를 반환하는지 확인"""
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
