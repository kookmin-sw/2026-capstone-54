from django.urls import reverse
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory
from users.models import User


class TokenRefreshAPIViewPropertyTests(TestCase):
  """TokenRefreshView property 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("token-refresh")
    User.objects.filter(email="tokenrefresh@example.com").delete()
    self.user = UserFactory(email="tokenrefresh@example.com")

  @given(st.just(None))
  @settings(max_examples=10, deadline=None)
  def test_refresh_with_valid_refresh_token_returns_new_access_token(self, _):
    """유효한 refresh 토큰을 전달하면 새로운 access 토큰이 포함된 200 응답이 반환된다."""
    refresh = RefreshToken.for_user(self.user)

    response = self.client.post(self.url, {"refresh": str(refresh)}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn("access", response.data)

  @given(invalid_token=st.text(min_size=10, max_size=100).filter(lambda t: "." not in t or len(t.split(".")) != 3), )
  @settings(max_examples=50, deadline=None)
  def test_refresh_with_invalid_token_returns_error(self, invalid_token):
    """유효하지 않은 refresh 토큰을 전달하면 400 또는 401 에러 응답이 반환된다."""
    response = self.client.post(self.url, {"refresh": invalid_token}, format="json")

    self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])

  @given(st.just(None))
  @settings(max_examples=10, deadline=None)
  def test_refresh_missing_token_returns_400(self, _):
    """refresh 필드 없이 요청하면 400 응답이 반환된다."""
    response = self.client.post(self.url, {}, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
