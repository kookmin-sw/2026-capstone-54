from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from streaks.factories import StreakLogFactory, StreakStatisticsFactory
from streaks.models import StreakStatistics
from streaks.services import StreakCalculator
from users.factories import UserFactory

User = get_user_model()


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

  def test_bulk_calculate_creates_new_statistics(self):
    users = [UserFactory() for _ in range(3)]
    for user in users:
      for days_ago in range(4, -1, -1):
        log_date = self.today - timedelta(days=days_ago)
        StreakLogFactory(user=user, date=log_date, interview_results_count=1)

    users_qs = User.objects.filter(id__in=[u.id for u in users])
    count = StreakCalculator.bulk_calculate(users_qs)

    self.assertEqual(count, 3)
    for user in users:
      stats = StreakStatistics.objects.get(user=user)
      self.assertEqual(stats.current_streak, 5)
      self.assertEqual(stats.total_days, 5)

  def test_bulk_calculate_updates_existing_statistics(self):
    users = [UserFactory() for _ in range(2)]
    for user in users:
      StreakStatisticsFactory(user=user, current_streak=1, longest_streak=1)
      for days_ago in range(4, -1, -1):
        log_date = self.today - timedelta(days=days_ago)
        StreakLogFactory(user=user, date=log_date, interview_results_count=1)

    users_qs = User.objects.filter(id__in=[u.id for u in users])
    count = StreakCalculator.bulk_calculate(users_qs)

    self.assertEqual(count, 2)
    for user in users:
      stats = StreakStatistics.objects.get(user=user)
      self.assertEqual(stats.current_streak, 5)
      self.assertEqual(stats.longest_streak, 5)

  def test_bulk_calculate_mixed_new_and_existing(self):
    users = [UserFactory() for _ in range(3)]

    StreakStatisticsFactory(user=users[0], current_streak=1, longest_streak=1)
    for days_ago in range(4, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=users[0], date=log_date, interview_results_count=1)

    for days_ago in range(2, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=users[1], date=log_date, interview_results_count=1)

    users_qs = User.objects.filter(id__in=[u.id for u in users])
    count = StreakCalculator.bulk_calculate(users_qs)

    self.assertEqual(count, 3)

    self.assertEqual(StreakStatistics.objects.get(user=users[0]).current_streak, 5)
    self.assertEqual(StreakStatistics.objects.get(user=users[1]).current_streak, 3)
    self.assertEqual(StreakStatistics.objects.get(user=users[2]).current_streak, 0)

  def test_bulk_calculate_with_zero_logs(self):
    users = [UserFactory() for _ in range(2)]
    users_qs = User.objects.filter(id__in=[u.id for u in users])
    count = StreakCalculator.bulk_calculate(users_qs)

    self.assertEqual(count, 2)
    for user in users:
      stats = StreakStatistics.objects.get(user=user)
      self.assertEqual(stats.current_streak, 0)
      self.assertEqual(stats.total_days, 0)
