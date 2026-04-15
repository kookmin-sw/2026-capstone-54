from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import TextResumeFactory
from users.factories import UserFactory


class ResumeActivationViewTests(TestCase):
  """POST /resumes/{uuid}/activate/ 와 /deactivate/ 테스트."""

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def setUp(self, mock_send_task):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

    self.resume = TextResumeFactory(user=self.user, is_active=True)
    self.activate_url = reverse("resume-activate", kwargs={"uuid": self.resume.pk})
    self.deactivate_url = reverse("resume-deactivate", kwargs={"uuid": self.resume.pk})

  def test_activate_inactive_resume_returns_200(self):
    """POST /activate/ → 200 이며 is_active=True 로 바뀐다."""
    self.resume.is_active = False
    self.resume.save(update_fields=["is_active"])

    response = self.client.post(self.activate_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.resume.refresh_from_db()
    self.assertTrue(self.resume.is_active)

  def test_deactivate_active_resume_returns_200(self):
    """POST /deactivate/ → 200 이며 is_active=False 로 바뀐다."""
    response = self.client.post(self.deactivate_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.resume.refresh_from_db()
    self.assertFalse(self.resume.is_active)

  def test_activating_other_users_resume_returns_404(self):
    """다른 사용자의 이력서는 접근할 수 없어야 한다 (404)."""
    other_user = UserFactory(email_confirmed_at=timezone.now())
    other_resume = TextResumeFactory(user=other_user, is_active=False)
    url = reverse("resume-activate", kwargs={"uuid": other_resume.pk})

    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    """로그인하지 않은 요청은 401 을 반환한다."""
    anonymous_client = APIClient()
    response = anonymous_client.post(self.activate_url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
