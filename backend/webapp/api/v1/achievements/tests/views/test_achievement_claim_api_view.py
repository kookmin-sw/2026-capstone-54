from unittest.mock import patch

from achievements.factories import AchievementFactory, UserAchievementFactory
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class AchievementClaimAPIViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

  @patch("tickets.services.grant_tickets_service.GrantTicketsService.execute")
  def test_claim_achievement_reward(self, _mock_grant):
    achievement = AchievementFactory(reward_payload={"type": "ticket", "amount": 2})
    UserAchievementFactory(user=self.user, achievement=achievement)
    url = reverse("achievement-claim", kwargs={"achievement_code": achievement.code})

    response = self.client.post(url, data={}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["achievement_code"], achievement.code)

  def test_returns_401_when_unauthenticated(self):
    """인증 없이 claim 시도하면 401을 반환한다."""
    unauthenticated_client = APIClient()
    achievement = AchievementFactory(reward_payload={"type": "ticket", "amount": 2})
    url = reverse("achievement-claim", kwargs={"achievement_code": achievement.code})

    response = unauthenticated_client.post(url, data={}, format="json")

    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  @patch("tickets.services.grant_tickets_service.GrantTicketsService.execute")
  def test_returns_400_when_reward_already_claimed(self, _mock_grant):
    """이미 보상을 수령한 도전과제를 다시 claim 시도하면 400을 반환한다."""
    achievement = AchievementFactory(reward_payload={"type": "ticket", "amount": 2})
    UserAchievementFactory(
      user=self.user,
      achievement=achievement,
      reward_claimed_at=timezone.now(),
    )
    url = reverse("achievement-claim", kwargs={"achievement_code": achievement.code})

    response = self.client.post(url, data={}, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_returns_404_when_achievement_not_found(self):
    """달성한 기록이 없는 achievement_code로 claim 시도하면 404를 반환한다."""
    url = reverse("achievement-claim", kwargs={"achievement_code": "nonexistent_code"})

    response = self.client.post(url, data={}, format="json")

    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
