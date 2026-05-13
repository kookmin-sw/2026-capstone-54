from django.urls import reverse
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class TokenRefreshCookieAPIViewTests(TestCase):
  """TokenRefreshAPIView 쿠키 우선 동작 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("token-refresh")
    self.user = UserFactory(email="cookie_refresh@example.com")

  @given(st.just(None))
  @settings(max_examples=5, deadline=None)
  def test_cookie_refresh_token_has_priority(self, _):
    """요청 바디와 쿠키가 모두 있을 때 쿠키의 refresh 토큰을 우선 사용한다."""
    cookie_refresh = RefreshToken.for_user(self.user)
    body_refresh = "invalid-refresh-token"

    self.client.cookies["mefit_refresh"] = str(cookie_refresh)
    response = self.client.post(self.url, {"refresh": body_refresh}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn("access", response.data)
