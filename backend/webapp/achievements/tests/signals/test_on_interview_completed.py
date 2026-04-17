from unittest.mock import patch

from achievements.constants import TRIGGER_KEY_INTERVIEW_COMPLETED, TRIGGER_TYPE_EVENT
from django.test import TestCase
from streaks.signals import interview_completed
from users.factories import UserFactory


class OnInterviewCompletedTests(TestCase):
  """interview_completed signal 수신 시 업적 평가 트리거 테스트."""

  @patch("achievements.signals.on_interview_completed.enqueue_evaluate_achievements_task")
  def test_enqueues_on_interview_completed(self, mock_enqueue):
    user = UserFactory()
    interview_completed.send(sender=self.__class__, user=user, streak_log=None)

    mock_enqueue.assert_called_once_with(
      user_id=user.id,
      trigger_type=TRIGGER_TYPE_EVENT,
      trigger_key=TRIGGER_KEY_INTERVIEW_COMPLETED,
      context={},
    )
