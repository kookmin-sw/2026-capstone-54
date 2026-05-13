from django.urls import reverse
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory
from users.models import User


class TokenVerifyAPIViewPropertyTests(TestCase):
  """TokenVerifyView property 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("token-verify")
    User.objects.filter(email="tokenverify@example.com").delete()
    self.user = UserFactory(email="tokenverify@example.com")

  @given(st.just(None))
  @settings(max_examples=5, deadline=None)
  def test_verify_valid_access_token_returns_200(self, _):
    """유효한 access 토큰을 전달하면 200 응답이 반환된다."""
    refresh = RefreshToken.for_user(self.user)
    access = str(refresh.access_token)

    response = self.client.post(self.url, {"token": access}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)

  @given(invalid_token=st.text(min_size=10, max_size=100).filter(lambda t: "." not in t or len(t.split(".")) != 3), )
  @settings(max_examples=5, deadline=None)
  def test_verify_invalid_token_returns_error(self, invalid_token):
    """유효하지 않은 토큰을 전달하면 400 또는 401 에러 응답이 반환된다."""
    response = self.client.post(self.url, {"token": invalid_token}, format="json")

    self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])

  @given(st.just(None))
  @settings(max_examples=5, deadline=None)
  def test_verify_missing_token_returns_400(self, _):
    """token 필드 없이 요청하면 400 응답이 반환된다."""
    response = self.client.post(self.url, {}, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
