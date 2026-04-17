from unittest.mock import patch

from achievements.constants import TRIGGER_KEY_USER_PROFILE_COMPLETED, TRIGGER_TYPE_EVENT
from django.test import TestCase
from django.utils import timezone
from users.factories import UserFactory


class OnProfileCompletedTests(TestCase):
  """User.profile_completed_at 변경 시 업적 평가 트리거 테스트."""

  @patch("achievements.signals.on_profile_completed.enqueue_evaluate_achievements_task")
  @patch("achievements.signals.on_profile_completed.transaction.on_commit", side_effect=lambda cb: cb())
  def test_enqueues_on_profile_completed_update(self, _mock_on_commit, mock_enqueue):
    user = UserFactory(profile_completed_at=None)
    user.profile_completed_at = timezone.now()
    user.save(update_fields=["profile_completed_at", "updated_at"])

    mock_enqueue.assert_called_once_with(
      user_id=user.id,
      trigger_type=TRIGGER_TYPE_EVENT,
      trigger_key=TRIGGER_KEY_USER_PROFILE_COMPLETED,
      context={},
    )

  @patch("achievements.signals.on_profile_completed.enqueue_evaluate_achievements_task")
  @patch("achievements.signals.on_profile_completed.transaction.on_commit", side_effect=lambda cb: cb())
  def test_does_not_enqueue_when_profile_completed_at_unchanged(self, _mock_on_commit, mock_enqueue):
    user = UserFactory(profile_completed_at=None)
    user.name = "updated-name"
    user.save(update_fields=["name", "updated_at"])

    mock_enqueue.assert_not_called()

  @patch("achievements.signals.on_profile_completed.enqueue_evaluate_achievements_task")
  @patch("achievements.signals.on_profile_completed.transaction.on_commit", side_effect=lambda cb: cb())
  def test_does_not_enqueue_when_profile_completed_at_is_none(self, _mock_on_commit, mock_enqueue):
    UserFactory(profile_completed_at=None)
    mock_enqueue.assert_not_called()
