"""TakeoverInterviewSessionView 테스트."""

from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from interviews.factories import InterviewSessionFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


@override_settings(
  CACHES={"default": {
    "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    "LOCATION": "test-takeover-view",
  }}
)
class TakeoverInterviewSessionViewTests(TestCase):
  """POST /interview-sessions/{uuid}/takeover/ 엔드포인트 검증."""

  def setUp(self):
    cache.clear()
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.session = InterviewSessionFactory(user=self.user)
    self.url = reverse("interview-takeover", kwargs={"interview_session_uuid": str(self.session.pk)})

  def tearDown(self):
    cache.clear()

  def test_returns_200_with_owner_token_and_ws_ticket(self):
    """정상 takeover 시 200 과 owner_token, owner_version, ws_ticket 을 반환한다."""
    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn("owner_token", response.data)
    self.assertIn("owner_version", response.data)
    self.assertIn("ws_ticket", response.data)

  def test_other_users_session_returns_404(self):
    """다른 사용자의 세션은 404 를 반환한다."""
    other_session = InterviewSessionFactory()
    url = reverse("interview-takeover", kwargs={"interview_session_uuid": str(other_session.pk)})

    response = self.client.post(url)

    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_returns_401(self):
    """인증되지 않은 요청은 401 을 반환한다."""
    self.client.credentials()

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_unverified_email_returns_403(self):
    """이메일 미인증 사용자는 403 을 반환한다."""
    unverified = UserFactory(email_confirmed_at=None)
    refresh_token = RefreshToken.for_user(unverified)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh_token.access_token}")
    session = InterviewSessionFactory(user=unverified)
    url = reverse("interview-takeover", kwargs={"interview_session_uuid": str(session.pk)})

    response = self.client.post(url)

    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_takeover_increments_owner_version(self):
    """takeover 후 DB owner_version 이 1 증가한다."""
    self.assertEqual(self.session.owner_version, 0)

    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      self.client.post(self.url)

    self.session.refresh_from_db()
    self.assertEqual(self.session.owner_version, 1)
