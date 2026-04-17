import threading
from unittest.mock import patch

from achievements.factories import AchievementFactory, UserAchievementFactory
from achievements.services import ClaimAchievementRewardService
from django.db import close_old_connections
from django.test import TestCase, TransactionTestCase
from rest_framework.exceptions import ValidationError
from tickets.models import UserTicket


class ClaimAchievementRewardServiceTests(TestCase):

  @patch("tickets.services.grant_tickets_service.GrantTicketsService.execute")
  def test_claims_reward_once(self, _mock_grant):
    achievement = AchievementFactory(reward_payload={"type": "ticket", "amount": 3})
    user_achievement = UserAchievementFactory(achievement=achievement)
    result = ClaimAchievementRewardService(
      user=user_achievement.user,
      achievement_code=achievement.code,
    ).perform()
    self.assertIsNotNone(result.reward_claimed_at)

  @patch("tickets.services.grant_tickets_service.GrantTicketsService.execute")
  def test_rejects_claim_when_already_claimed(self, _mock_grant):
    achievement = AchievementFactory(reward_payload={"type": "ticket", "amount": 3})
    user_achievement = UserAchievementFactory(achievement=achievement)
    ClaimAchievementRewardService(user=user_achievement.user, achievement_code=achievement.code).perform()
    with self.assertRaises(ValidationError):
      ClaimAchievementRewardService(user=user_achievement.user, achievement_code=achievement.code).perform()

  @patch("tickets.services.grant_tickets_service.GrantTicketsService.execute")
  def test_rejects_claim_for_inactive_achievement(self, _mock_grant):
    achievement = AchievementFactory(
      is_active=False,
      reward_payload={
        "type": "ticket",
        "amount": 3
      },
    )
    user_achievement = UserAchievementFactory(achievement=achievement)

    with self.assertRaises(ValidationError):
      ClaimAchievementRewardService(user=user_achievement.user, achievement_code=achievement.code).perform()

  def test_ticket_purchased_count_increases_by_reward_amount(self):
    """claim 후 UserTicket.purchased_count가 reward_payload의 amount만큼 증가한다."""
    achievement = AchievementFactory(reward_payload={"type": "ticket", "amount": 3})
    user_achievement = UserAchievementFactory(achievement=achievement)
    user = user_achievement.user

    ClaimAchievementRewardService(
      user=user,
      achievement_code=achievement.code,
    ).perform()

    ticket = UserTicket.objects.get(user=user)
    self.assertEqual(ticket.purchased_count, 3)

  def test_single_user_ticket_record_exists_after_claim(self):
    """claim 후 해당 사용자의 UserTicket 레코드가 정확히 1개만 존재한다."""
    achievement = AchievementFactory(reward_payload={"type": "ticket", "amount": 5})
    user_achievement = UserAchievementFactory(achievement=achievement)
    user = user_achievement.user

    ClaimAchievementRewardService(
      user=user,
      achievement_code=achievement.code,
    ).perform()

    self.assertEqual(UserTicket.objects.filter(user=user).count(), 1)


class ClaimAchievementRewardRaceConditionTests(TransactionTestCase):
  reset_sequences = True

  @patch("tickets.services.grant_tickets_service.GrantTicketsService.execute")
  def test_allows_only_one_claim_under_concurrency(self, mock_grant):
    achievement = AchievementFactory(reward_payload={"type": "ticket", "amount": 3})
    user_achievement = UserAchievementFactory(achievement=achievement)
    barrier = threading.Barrier(2)
    results = []
    errors = []

    def claim_in_thread():
      close_old_connections()
      try:
        barrier.wait(timeout=5)
        result = ClaimAchievementRewardService(
          user=user_achievement.user,
          achievement_code=achievement.code,
        ).perform()
        results.append(result.id)
      except Exception as exc:  # noqa: BLE001
        errors.append(exc)
      finally:
        close_old_connections()

    first = threading.Thread(target=claim_in_thread)
    second = threading.Thread(target=claim_in_thread)
    first.start()
    second.start()
    first.join(timeout=5)
    second.join(timeout=5)

    self.assertEqual(len(results), 1)
    self.assertEqual(len(errors), 1)
    self.assertIsInstance(errors[0], ValidationError)
    self.assertEqual(mock_grant.call_count, 1)
