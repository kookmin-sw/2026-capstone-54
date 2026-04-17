from unittest.mock import patch

from achievements.factories import AchievementFactory
from achievements.models import UserAchievement
from achievements.services import EvaluateAchievementsService
from achievements.services.condition_evaluator import EvaluationResult
from django.test import TestCase
from django.utils import timezone
from users.factories import UserFactory


class EvaluateAchievementsServiceTests(TestCase):

  def test_creates_user_achievement_when_condition_satisfied(self):
    user = UserFactory(profile_completed_at=timezone.now())
    achievement = AchievementFactory(
      condition_payload={
        "type": "field_exists",
        "field_path": "users.profile_completed_at",
        "exists": True,
      }
    )
    created = EvaluateAchievementsService(user=user).perform()
    self.assertEqual(len(created), 1)
    self.assertTrue(UserAchievement.objects.filter(user=user, achievement=achievement).exists())

  def test_is_idempotent_for_same_achievement(self):
    user = UserFactory(profile_completed_at=timezone.now())
    AchievementFactory(
      condition_payload={
        "type": "field_exists",
        "field_path": "users.profile_completed_at",
        "exists": True,
      }
    )
    EvaluateAchievementsService(user=user).perform()
    EvaluateAchievementsService(user=user).perform()
    self.assertEqual(UserAchievement.objects.filter(user=user).count(), 1)

  def test_stores_standardized_snapshot_payload(self):
    user = UserFactory(profile_completed_at=timezone.now())
    achievement = AchievementFactory(
      condition_payload={
        "type": "field_exists",
        "field_path": "users.profile_completed_at",
        "exists": True,
      }
    )

    created = EvaluateAchievementsService(user=user).perform()
    self.assertEqual(len(created), 1)

    user_achievement = UserAchievement.objects.get(user=user, achievement=achievement)
    snapshot = user_achievement.achievement_snapshot_payload
    self.assertEqual(snapshot["version"], 1)
    self.assertEqual(snapshot["achievement_code"], achievement.code)
    self.assertIn("captured_at", snapshot)
    self.assertIn("evidence", snapshot)
    self.assertIn("errors", snapshot)

  def test_skips_achievement_when_evaluator_raises_error(self):
    user = UserFactory(profile_completed_at=timezone.now())
    achievement = AchievementFactory(
      condition_payload={
        "type": "field_exists",
        "field_path": "users.unknown_field",
        "exists": True,
      }
    )

    created = EvaluateAchievementsService(user=user).perform()
    self.assertEqual(created, [])
    self.assertFalse(UserAchievement.objects.filter(user=user, achievement=achievement).exists())

  @patch("achievements.services.evaluate_achievements_service.ConditionEvaluator.evaluate")
  def test_truncates_snapshot_payload_when_too_large(self, mock_evaluate):
    user = UserFactory(profile_completed_at=timezone.now())
    achievement = AchievementFactory(
      condition_payload={
        "type": "field_exists",
        "field_path": "users.profile_completed_at",
        "exists": True,
      }
    )
    mock_evaluate.return_value = EvaluationResult(
      is_satisfied=True,
      evidence={"very_large_blob": "x" * 10000},
      errors=[],
    )

    created = EvaluateAchievementsService(user=user).perform()
    self.assertEqual(len(created), 1)

    user_achievement = UserAchievement.objects.get(user=user, achievement=achievement)
    snapshot = user_achievement.achievement_snapshot_payload
    self.assertEqual(snapshot["evidence"]["truncated"], True)
    self.assertEqual(snapshot["errors"], ["snapshot_payload_truncated"])
