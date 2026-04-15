"""ResumeCountStatsView 테스트."""

from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.enums import AnalysisStatus
from resumes.factories import FileResumeFactory, TextResumeFactory
from users.factories import UserFactory


class ResumeCountStatsViewTests(TestCase):
  """GET /stats/count/ — 상태/활성 기준 집계."""

  @patch("resumes.services.mixins.file_resume_pipeline_mixin.default_storage")
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def setUp(self, _send_task, _storage):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    TextResumeFactory(
      user=self.user,
      is_active=True,
      is_parsed=True,
      analysis_status=AnalysisStatus.COMPLETED,
      analyzed_at=timezone.now(),
    )
    TextResumeFactory(user=self.user, is_active=False, analysis_status=AnalysisStatus.PROCESSING)
    FileResumeFactory(user=self.user, analysis_status=AnalysisStatus.FAILED)
    self.url = reverse("resume-stats-count")

  def test_returns_aggregated_counts(self):
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    body = response.json()
    self.assertEqual(body["total"], 3)
    self.assertEqual(body["completed"], 1)
    self.assertEqual(body["processing"], 1)
    self.assertEqual(body["failed"], 1)
    self.assertEqual(body["active"], 2)
    self.assertEqual(body["inactive"], 1)

  def test_excludes_other_users(self):
    other = UserFactory(email_confirmed_at=timezone.now())
    TextResumeFactory(user=other)
    response = self.client.get(self.url)
    self.assertEqual(response.json()["total"], 3)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
