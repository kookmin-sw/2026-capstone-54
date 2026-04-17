from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class AchievementRefreshAPIViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.url = reverse("achievement-refresh")

  @patch("api.v1.achievements.views.achievement_refresh_api_view.check_and_mark_manual_refresh", return_value=(True, 0))
  @patch("api.v1.achievements.views.achievement_refresh_api_view.enqueue_evaluate_achievements_task", return_value=True)
  def test_returns_202_on_allowed_refresh(self, _mock_enqueue, _mock_rate_limit):
    response = self.client.post(self.url, data={}, format="json")
    self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
    self.assertIn("created_achievements_count", response.data)

  @patch(
    "api.v1.achievements.views.achievement_refresh_api_view.check_and_mark_manual_refresh", return_value=(False, 120)
  )
  def test_returns_429_when_rate_limited(self, _mock_rate_limit):
    response = self.client.post(self.url, data={}, format="json")
    self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
    self.assertEqual(response.data["error_code"], "ACHIEVEMENT_REFRESH_RATE_LIMITED")
