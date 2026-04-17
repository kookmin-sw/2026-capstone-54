from unittest.mock import call, patch

from achievements.constants import TRIGGER_KEY_STREAK_EXPIRED, TRIGGER_TYPE_EVENT
from django.test import TestCase
from streaks.signals import streak_expired
from users.factories import UserFactory


class OnStreakExpiredTests(TestCase):
  """streak_expired signal 수신 시 업적 평가 트리거 테스트."""

  @patch("achievements.signals.on_streak_expired.enqueue_evaluate_achievements_task")
  def test_enqueues_for_each_expired_user(self, mock_enqueue):
    users = UserFactory.create_batch(3)
    user_ids = [u.id for u in users]

    streak_expired.send(sender=self.__class__, expired_user_ids=user_ids)

    self.assertEqual(mock_enqueue.call_count, 3)
    mock_enqueue.assert_has_calls(
      [
        call(user_id=uid, trigger_type=TRIGGER_TYPE_EVENT, trigger_key=TRIGGER_KEY_STREAK_EXPIRED, context={})
        for uid in user_ids
      ],
      any_order=True,
    )

  @patch("achievements.signals.on_streak_expired.enqueue_evaluate_achievements_task")
  def test_does_not_enqueue_when_no_expired_users(self, mock_enqueue):
    streak_expired.send(sender=self.__class__, expired_user_ids=[])
    mock_enqueue.assert_not_called()
