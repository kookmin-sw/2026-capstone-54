from unittest.mock import patch

from achievements.factories import AchievementFactory
from achievements.models import UserAchievement
from achievements.services import ClaimAchievementRewardService, EvaluateAchievementsService
from django.test import TestCase
from django.utils import timezone
from users.factories import UserFactory


class AchievementEndToEndFlowTests(TestCase):

  @patch("tickets.services.grant_tickets_service.GrantTicketsService.execute")
  def test_create_achieve_claim_and_verify_flow(self, _mock_grant):
    """도전과제 생성부터 달성, 보상 수령, 최종 상태 확인까지 전체 흐름을 검증한다."""
    user = UserFactory(profile_completed_at=None)
    achievement = AchievementFactory(
      code="complete_profile_once",
      condition_payload={
        "type": "field_exists",
        "field_path": "users.profile_completed_at",
        "exists": True,
      },
      reward_payload={
        "type": "ticket",
        "amount": 2,
      },
    )

    # 1) 미달성 상태 검증
    created = EvaluateAchievementsService(user=user).perform()
    self.assertEqual(created, [])
    self.assertFalse(UserAchievement.objects.filter(user=user, achievement=achievement).exists())

    # 2) 조건 충족 후 달성 생성 검증
    user.profile_completed_at = timezone.now()
    user.save(update_fields=["profile_completed_at", "updated_at"])
    created = EvaluateAchievementsService(user=user).perform()
    self.assertEqual(len(created), 1)

    user_achievement = UserAchievement.objects.get(user=user, achievement=achievement)
    self.assertIsNotNone(user_achievement.achieved_at)
    self.assertIsNone(user_achievement.reward_claimed_at)

    # 3) 보상 수령 후 상태 검증
    claimed = ClaimAchievementRewardService(user=user, achievement_code=achievement.code).perform()
    self.assertIsNotNone(claimed.reward_claimed_at)

    user_achievement.refresh_from_db()
    self.assertIsNotNone(user_achievement.reward_claimed_at)
