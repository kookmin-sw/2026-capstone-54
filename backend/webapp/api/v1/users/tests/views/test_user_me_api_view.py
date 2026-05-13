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
  @settings(max_examples=5, deadline=None)
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


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class UserMePatchAPIViewTests(TestCase):
  """UserMeAPIView PATCH 동작 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("user-me")
    self.user = UserFactory(email="patchme@example.com", name="OldName")
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

  def test_authenticated_user_can_update_name(self):
    """인증된 사용자는 PATCH /me 로 name을 수정할 수 있고 변경된 정보가 응답된다"""
    response = self.client.patch(self.url, data={"name": "NewName"}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["name"], "NewName")
    self.assertEqual(response.data["email"], self.user.email)

    self.user.refresh_from_db()
    self.assertEqual(self.user.name, "NewName")

  def test_blank_name_returns_400(self):
    """빈 문자열 name으로 PATCH 시 400 응답"""
    response = self.client.patch(self.url, data={"name": ""}, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.user.refresh_from_db()
    self.assertEqual(self.user.name, "OldName")

  def test_too_long_name_returns_400(self):
    """50자를 초과하는 name 으로 PATCH 시 400 응답"""
    response = self.client.patch(self.url, data={"name": "x" * 51}, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.user.refresh_from_db()
    self.assertEqual(self.user.name, "OldName")

  def test_missing_name_returns_400(self):
    """name 필드 자체가 없을 때 400 응답"""
    response = self.client.patch(self.url, data={}, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.user.refresh_from_db()
    self.assertEqual(self.user.name, "OldName")

  def test_max_length_name_succeeds(self):
    """50자 정확히 일치하는 name 은 허용된다"""
    new_name = "y" * 50

    response = self.client.patch(self.url, data={"name": new_name}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.user.refresh_from_db()
    self.assertEqual(self.user.name, new_name)

  def test_unauthenticated_user_cannot_patch(self):
    """비인증 사용자는 PATCH 할 수 없다"""
    self.client.credentials()

    response = self.client.patch(self.url, data={"name": "X"}, format="json")

    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )
