"""ResumeRecentActivityStatsView 테스트."""

from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.enums import AnalysisStatus
from resumes.factories import TextResumeFactory
from users.factories import UserFactory


class ResumeRecentActivityStatsViewTests(TestCase):
  """GET /stats/recent-activity/ — 최근 N일 분석 완료 수."""

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def setUp(self, _send_task):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    TextResumeFactory(
      user=self.user,
      is_parsed=True,
      analysis_status=AnalysisStatus.COMPLETED,
      analyzed_at=timezone.now(),
    )
    self.url = reverse("resume-stats-recent-activity")

  def test_default_window_is_seven_days(self):
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    body = response.json()
    self.assertEqual(body["days"], 7)
    self.assertGreaterEqual(body["recentlyAnalyzedCount"], 1)

  def test_custom_days_query_param(self):
    response = self.client.get(self.url + "?days=30")
    self.assertEqual(response.json()["days"], 30)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
