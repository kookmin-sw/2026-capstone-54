from achievements.factories import AchievementFactory, UserAchievementFactory
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class AchievementListAPIViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.url = reverse("achievement-list")

  def test_returns_achievements_with_user_status(self):
    achievement = AchievementFactory()
    UserAchievementFactory(user=self.user, achievement=achievement)

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data["results"]), 1)
    self.assertTrue(response.data["results"][0]["is_achieved"])

  def test_can_claim_reward_is_true_for_achieved_unclaimed(self):
    """달성했지만 아직 보상을 수령하지 않은 업적은 can_claim_reward=True를 반환한다."""
    achievement = AchievementFactory()
    UserAchievementFactory(user=self.user, achievement=achievement, reward_claimed_at=None)

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    item = next((d for d in response.data["results"] if d["code"] == achievement.code), None)
    self.assertIsNotNone(item, f"Achievement with code {achievement.code} not found in response")
    self.assertTrue(item["can_claim_reward"])

  def test_can_claim_reward_is_false_for_already_claimed(self):
    """보상을 이미 수령한 업적은 can_claim_reward=False를 반환한다."""
    achievement = AchievementFactory()
    UserAchievementFactory(
      user=self.user,
      achievement=achievement,
      reward_claimed_at=timezone.now(),
    )

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    item = next((d for d in response.data["results"] if d["code"] == achievement.code), None)
    self.assertIsNotNone(item, f"Achievement with code {achievement.code} not found in response")
    self.assertFalse(item["can_claim_reward"])

  def test_can_claim_reward_is_false_for_not_achieved(self):
    """달성하지 않은 업적은 can_claim_reward=False를 반환한다."""
    achievement = AchievementFactory()
    # UserAchievement 없이 Achievement만 생성

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    item = next((d for d in response.data["results"] if d["code"] == achievement.code), None)
    self.assertIsNotNone(item, f"Achievement with code {achievement.code} not found in response")
    self.assertFalse(item["can_claim_reward"])
    self.assertFalse(item["is_achieved"])

  def test_returns_401_when_unauthenticated(self):
    """인증 없이 목록 조회 시 401을 반환한다."""
    unauthenticated_client = APIClient()

    response = unauthenticated_client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
