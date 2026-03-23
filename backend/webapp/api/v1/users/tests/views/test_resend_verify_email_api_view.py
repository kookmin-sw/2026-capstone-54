from datetime import timedelta

from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import EmailVerificationCode, User


@override_settings(
  EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
  CELERY_TASK_ALWAYS_EAGER=True,
)
class ResendVerifyEmailAPIViewPropertyTests(TestCase):
  """ResendVerifyEmailAPIView property 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("resend-verify-email")

  @given(st.just(None))
  @settings(max_examples=1, deadline=None)
  def test_resend_invalidates_old_codes_and_creates_new_one(self, _):
    """미인증 User에 대해 인증 코드 재발송을 요청하면 기존 미사용 EmailVerificationCode가 만료 처리되고 새로운 코드가 생성된다."""
    email = "resend_test@example.com"
    User.objects.filter(email=email).delete()
    user = User.objects.create_user(
      email=email,
      password="ValidPass123!",
      name="재발송테스트유저",
    )

    # 기존 미사용 코드 생성 (이미 만료된 코드 — expires_at 과거)
    old_code = EmailVerificationCode.objects.create(
      user=user,
      code="OLD123",
      expires_at=timezone.now() - timedelta(minutes=1),
    )
    old_code_id = old_code.id

    # 인증된 유저로 요청
    access_token = str(RefreshToken.for_user(user).access_token)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    response = self.client.post(self.url, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)

    # 기존 코드가 만료 처리(is_used=True)되어야 한다
    old_code.refresh_from_db()
    self.assertTrue(old_code.is_used)

    # 새로운 코드가 생성되어야 한다
    new_codes = EmailVerificationCode.objects.filter(
      user=user,
      used_at__isnull=True,
    ).exclude(id=old_code_id)
    self.assertTrue(new_codes.exists())

  @given(st.just(None))
  @settings(max_examples=10, deadline=None)
  def test_resend_unauthenticated_returns_401(self, _):
    """비인증 요청은 401을 반환한다."""
    self.client.credentials()
    response = self.client.post(self.url, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  @given(st.just(None))
  @settings(max_examples=10, deadline=None)
  def test_resend_within_cooldown_returns_400(self, _):
    """최근 10분 내 인증 코드가 이미 발송된 경우 재전송 요청은 400을 반환한다."""
    email = "resend_cooldown_test@example.com"
    User.objects.filter(email=email).delete()
    user = User.objects.create_user(
      email=email,
      password="ValidPass123!",
      name="쿨다운테스트유저",
    )

    # 10분 이내에 생성된 코드 존재
    EmailVerificationCode.objects.create(
      user=user,
      code="NEW123",
      expires_at=timezone.now() + timedelta(minutes=10),
    )

    access_token = str(RefreshToken.for_user(user).access_token)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    response = self.client.post(self.url, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
