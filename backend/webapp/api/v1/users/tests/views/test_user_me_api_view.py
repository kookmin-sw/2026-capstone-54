from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory
from users.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class UserMeAPIViewPropertyTests(TestCase):
  """UserMeAPIView property 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("user-me")

  @given(
    name=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Lo"))),
    is_email_confirmed=st.booleans(),
    is_profile_completed=st.booleans(),
  )
  @settings(max_examples=10, deadline=None)
  def test_authenticated_user_me_response_matches_user_model(self, name, is_email_confirmed, is_profile_completed):
    """인증된 User에 대해 GET /me 요청 시 반환되는 name/email/is_email_confirmed/is_profile_completed 값이 User 모델의 실제 값과 일치한다."""
    email = "me_test@example.com"
    User.objects.filter(email=email).delete()
    user = UserFactory(email=email, name=name)

    if is_email_confirmed:
      user.email_confirmed_at = timezone.now()
    else:
      user.email_confirmed_at = None

    if is_profile_completed:
      user.profile_completed_at = timezone.now()
    else:
      user.profile_completed_at = None

    user.save()

    token = RefreshToken.for_user(user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["name"], user.name)
    self.assertEqual(response.data["email"], user.email)
    self.assertEqual(response.data["is_email_confirmed"], user.is_email_confirmed)
    self.assertEqual(response.data["is_profile_completed"], user.is_profile_completed)

  def test_unauthenticated_user_denied(self):
    """비인증 사용자는 접근할 수 없다"""
    response = self.client.get(self.url)
    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )
