from datetime import date, timedelta
from unittest.mock import patch

from django.test import TestCase
from streaks.factories import StreakLogFactory
from streaks.models import StreakLog
from streaks.services import StreakLogManager
from threads import Thread
from users.factories import UserFactory


class StreakLogManagerTests(TestCase):

  def setUp(self):
    self.user = UserFactory()
    self.today = date(2025, 3, 10)

  def _perform(self, user=None, today=None):
    target_user = user or self.user
    target_date = today or self.today
    with patch("streaks.services.streak_log_manager.timezone.localdate") as mock_localdate:
      mock_localdate.return_value = target_date
      return StreakLogManager(target_user).increment()

  def test_create_streak_log_on_first_interview(self):
    log = self._perform()
    self.assertTrue(StreakLog.objects.filter(user=self.user, date=self.today).exists())
    self.assertEqual(log.interview_results_count, 1)

  def test_increment_interview_count_on_same_day(self):
    StreakLogFactory(user=self.user, date=self.today, interview_results_count=1)
    self._perform()
    retrieved_log = StreakLog.objects.get(user=self.user, date=self.today)
    self.assertEqual(retrieved_log.interview_results_count, 2)

  def test_create_new_log_for_different_days(self):
    yesterday = self.today - timedelta(days=1)
    StreakLogFactory(user=self.user, date=yesterday, interview_results_count=1)
    self._perform()
    self.assertEqual(StreakLog.objects.filter(user=self.user).count(), 2)

  def test_concurrent_increments_use_select_for_update(self):
    results = []

    def increment_in_thread():
      log = StreakLogManager(self.user).increment()
      results.append(log.interview_results_count)

    thread1 = Thread(target=increment_in_thread)
    thread2 = Thread(target=increment_in_thread)

    thread1.start()
    thread2.start()
    thread1.join()
    thread2.join()

    final_log = StreakLog.objects.get(user=self.user, date=self.today)
    self.assertEqual(final_log.interview_results_count, 2)
