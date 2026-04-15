"""ResumeTypeStatsView 테스트."""

from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import FileResumeFactory, TextResumeFactory
from users.factories import UserFactory


class ResumeTypeStatsViewTests(TestCase):
  """GET /stats/type/ — 파일/텍스트 개수."""

  @patch("resumes.services.mixins.file_resume_pipeline_mixin.default_storage")
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def setUp(self, _send_task, _storage):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    TextResumeFactory(user=self.user)
    TextResumeFactory(user=self.user)
    FileResumeFactory(user=self.user)
    self.url = reverse("resume-stats-type")

  def test_returns_file_and_text_counts(self):
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    body = response.json()
    self.assertEqual(body["textCount"], 2)
    self.assertEqual(body["fileCount"], 1)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
