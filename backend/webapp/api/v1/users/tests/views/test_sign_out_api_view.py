from django.test import override_settings
from django.urls import reverse
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory
from users.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class SignOutAPIViewPropertyTests(TestCase):
  """SignOutAPIView property 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("sign-out")
    User.objects.filter(email="signout_test@example.com").delete()
    self.user = UserFactory(email="signout_test@example.com")

  @given(st.just(None))
  @settings(max_examples=1, deadline=None)
  def test_sign_out_with_valid_refresh_token_blacklists_token(self, _):
    """유효한 refresh 토큰으로 로그아웃하면 205 응답이 반환되고 해당 토큰이 블랙리스트에 등록되어 재사용이 불가능하다."""
    token = RefreshToken.for_user(self.user)
    refresh_str = str(token)

    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    response = self.client.post(self.url, {"refresh": refresh_str}, format="json")

    self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

    # 동일 토큰으로 재사용 시도 — 블랙리스트에 등록되어 실패해야 한다
    token2 = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token2.access_token)}")
    second_response = self.client.post(self.url, {"refresh": refresh_str}, format="json")

    self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)

  @given(invalid_token=st.text(min_size=1, max_size=200).filter(lambda s: "." not in s or len(s.split(".")) != 3), )
  @settings(max_examples=10, deadline=None)
  def test_sign_out_with_invalid_refresh_token_returns_400(self, invalid_token):
    """유효하지 않은 문자열을 refresh 토큰으로 로그아웃을 시도하면 400 에러가 반환된다."""
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

    response = self.client.post(self.url, {"refresh": invalid_token}, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
