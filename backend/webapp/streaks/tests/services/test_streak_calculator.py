from datetime import date, timedelta
from unittest.mock import patch

from django.test import TestCase
from streaks.factories import StreakLogFactory, StreakStatisticsFactory
from streaks.services import StreakCalculator
from users.factories import UserFactory


class StreakCalculatorTests(TestCase):

  def setUp(self):
    self.user = UserFactory()
    self.today = date(2025, 3, 10)

  def _perform(self, user=None, today=None):
    target_user = user or self.user
    target_date = today or self.today
    with patch("streaks.services.streak_calculator.timezone.localdate") as mock_localdate:
      mock_localdate.return_value = target_date
      return StreakCalculator(target_user).calculate()

  def test_calculate_total_days_zero_when_no_logs(self):
    stats = self._perform()
    self.assertEqual(stats.total_days, 0)
    self.assertEqual(stats.current_streak, 0)
    self.assertEqual(stats.longest_streak, 0)

  def test_total_days_counts_only_positive_interview_results(self):
    for days_ago in range(2, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date, interview_results_count=1)

    for days_ago in [5, 6]:
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date, interview_results_count=0)

    stats = self._perform()
    self.assertEqual(stats.total_days, 3)
    self.assertEqual(stats.longest_streak, 3)

  def test_total_days_zero_when_all_counts_are_zero(self):
    for days_ago in range(4, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date, interview_results_count=0)

    stats = self._perform()
    self.assertEqual(stats.total_days, 0)
    self.assertEqual(stats.current_streak, 0)
    self.assertEqual(stats.longest_streak, 0)

  def test_consecutive_streak_calculation(self):
    for days_ago in range(4, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date, interview_results_count=1)

    stats = self._perform()
    self.assertEqual(stats.current_streak, 5)
    self.assertEqual(stats.longest_streak, 5)

  def test_current_streak_zero_when_not_consecutive(self):
    for days_ago in range(10, 5, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date, interview_results_count=1)

    for days_ago in range(2, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date, interview_results_count=1)

    stats = self._perform()
    self.assertEqual(stats.current_streak, 3)
    self.assertEqual(stats.longest_streak, 6)

  def test_current_streak_reset_when_gap_exists(self):
    three_days_ago = self.today - timedelta(days=3)
    StreakLogFactory(user=self.user, date=three_days_ago, interview_results_count=1)

    stats = self._perform()
    self.assertEqual(stats.current_streak, 0)
    self.assertEqual(stats.longest_streak, 1)
    self.assertEqual(stats.last_participated_date, three_days_ago)

  def test_current_streak_continues_when_last_participation_was_yesterday(self):
    yesterday = self.today - timedelta(days=1)
    StreakLogFactory(user=self.user, date=yesterday, interview_results_count=1)

    stats = self._perform()
    self.assertEqual(stats.current_streak, 1)

  def test_longest_streak_updated_when_current_exceeds(self):
    StreakStatisticsFactory(
      user=self.user,
      current_streak=1,
      longest_streak=3,
      last_participated_date=self.today - timedelta(days=2),
    )

    for days_ago in range(1, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date, interview_results_count=1)

    stats = self._perform()
    self.assertEqual(stats.current_streak, 2)
    self.assertEqual(stats.longest_streak, 2)
