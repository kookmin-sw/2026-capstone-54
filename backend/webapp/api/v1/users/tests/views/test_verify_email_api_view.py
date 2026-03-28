from django.test import override_settings
from django.urls import reverse
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import EmailVerificationCodeFactory, UserFactory
from users.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class VerifyEmailAPIViewPropertyTests(TestCase):
  """VerifyEmailAPIView property 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("verify-email")

  def _create_user_with_code(self, email, code):
    """테스트용 유저와 유효한 OTP 코드를 생성하고 JWT 인증을 설정한다."""
    User.objects.filter(email=email).delete()
    user = UserFactory(email=email)
    EmailVerificationCodeFactory(user=user, code=code)
    token = RefreshToken.for_user(user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return user

  @given(code=st.text(
    min_size=6,
    max_size=6,
    alphabet=st.characters(whitelist_categories=("Lu", "Nd")),
  ))
  @settings(max_examples=10, deadline=None)
  def test_verify_email_with_valid_otp_sets_email_confirmed_at(self, code):
    """미인증 User의 유효한 OTP 코드로 이메일 인증하면 200 응답이 반환되고 user.email_confirmed_at이 설정된다."""
    email = "verify_valid_test@example.com"
    user = self._create_user_with_code(email, code)

    self.assertIsNone(user.email_confirmed_at)

    response = self.client.post(self.url, {"code": code}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)

    user.refresh_from_db()
    self.assertIsNotNone(user.email_confirmed_at)

  @given(wrong_code=st.text(
    min_size=6,
    max_size=6,
    alphabet=st.characters(whitelist_categories=("Lu", "Nd")),
  ))
  @settings(max_examples=10, deadline=None)
  def test_verify_email_with_wrong_code_returns_400(self, wrong_code):
    """User에게 발급되지 않은 임의의 6자리 코드로 이메일 인증을 시도하면 400 에러가 반환되고 email_confirmed_at은 변경되지 않는다."""
    from hypothesis import assume

    real_code = "AAAAAA"
    assume(wrong_code != real_code)

    email = "verify_wrong_test@example.com"
    user = self._create_user_with_code(email, real_code)

    self.assertIsNone(user.email_confirmed_at)

    response = self.client.post(self.url, {"code": wrong_code}, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    user.refresh_from_db()
    self.assertIsNone(user.email_confirmed_at)

  @given(st.just(None))
  @settings(max_examples=1, deadline=None)
  def test_unauthenticated_request_returns_401(self, _):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    response = self.client.post(self.url, {"code": "ABC123"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
