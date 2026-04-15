"""ResumeTopSkillsStatsView 테스트."""

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


class ResumeTopSkillsStatsViewTests(TestCase):
  """GET /stats/top-skills/ — 가장 많이 등장한 스킬."""

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def setUp(self, _send_task):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    TextResumeFactory(
      user=self.user,
      is_parsed=True,
      analysis_status=AnalysisStatus.COMPLETED,
      parsed_data={"skills": {
        "technical": ["Python", "Django"],
        "tools": [],
        "soft": [],
        "languages": []
      }},
    )
    self.url = reverse("resume-stats-top-skills")

  def test_returns_skill_names(self):
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    skill_names = [s["name"] for s in response.json()["topSkills"]]
    self.assertIn("Python", skill_names)
    self.assertIn("Django", skill_names)

  def test_respects_limit_query_param(self):
    response = self.client.get(self.url + "?limit=1")
    self.assertLessEqual(len(response.json()["topSkills"]), 1)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
