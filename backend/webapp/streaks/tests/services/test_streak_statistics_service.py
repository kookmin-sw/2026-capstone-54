from datetime import date, timedelta
from unittest.mock import patch

from django.test import TestCase
from streaks.factories import StreakLogFactory, StreakStatisticsFactory
from streaks.models import StreakLog, StreakStatistics
from streaks.services import StreakStatisticsService
from users.factories import UserFactory


class StreakStatisticsServiceTests(TestCase):

  def setUp(self):
    self.user = UserFactory()
    self.today = date(2025, 3, 10)

  def _record(self, user=None, today=None):
    target_user = user or self.user
    target_date = today or self.today
    with patch("streaks.services.streak_statistics_service.timezone.localdate") as mock_localdate:
      mock_localdate.return_value = target_date
      return StreakStatisticsService(target_user).record_participation()

  def _recalculate(self, user=None, today=None):
    target_user = user or self.user
    target_date = today or self.today
    with patch("streaks.services.streak_statistics_service.timezone.localdate") as mock_localdate:
      mock_localdate.return_value = target_date
      return StreakStatisticsService(target_user).recalculate()

  def _expire(self, user=None, today=None):
    target_user = user or self.user
    target_date = today or self.today
    with patch("streaks.services.streak_statistics_service.timezone.localdate") as mock_localdate:
      mock_localdate.return_value = target_date
      return StreakStatisticsService(target_user).expire_streaks()

  def test_record_participation_creates_streak_log(self):
    self._record()
    self.assertTrue(StreakLog.objects.filter(user=self.user, date=self.today).exists())

  def test_record_participation_increments_count(self):
    StreakLogFactory(user=self.user, date=self.today, interview_results_count=1)
    self._record()
    log = StreakLog.objects.get(user=self.user, date=self.today)
    self.assertEqual(log.interview_results_count, 2)

  def test_record_participation_calculates_statistics(self):
    self._record()
    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 1)
    self.assertEqual(stats.total_days, 1)

  def test_record_participation_consecutive_streak(self):
    yesterday = self.today - timedelta(days=1)
    StreakLogFactory(user=self.user, date=yesterday, interview_results_count=1)
    self._record()
    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 2)

  def test_record_participation_resets_broken_streak(self):
    for days_ago in range(10, 7, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date, interview_results_count=1)

    StreakStatisticsFactory(
      user=self.user,
      current_streak=4,
      longest_streak=4,
      last_participated_date=self.today - timedelta(days=10),
    )
    self._record()

    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 1)

  def test_recalculate_without_logs(self):
    stats = self._recalculate()
    self.assertEqual(stats.total_days, 0)
    self.assertEqual(stats.current_streak, 0)

  def test_recalculate_with_logs(self):
    for days_ago in range(4, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date, interview_results_count=1)

    stats = self._recalculate()
    self.assertEqual(stats.current_streak, 5)
    self.assertEqual(stats.total_days, 5)

  def test_expire_streaks_with_expired_user(self):
    two_days_ago = self.today - timedelta(days=2)
    StreakStatisticsFactory(
      user=self.user,
      current_streak=5,
      last_participated_date=two_days_ago,
    )

    result = self._expire()
    self.assertEqual(result["expired_count"], 1)

    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 0)

  def test_expire_streaks_ignores_active_user(self):
    yesterday = self.today - timedelta(days=1)
    StreakStatisticsFactory(
      user=self.user,
      current_streak=5,
      last_participated_date=yesterday,
    )

    result = self._expire()
    self.assertEqual(result["expired_count"], 0)

    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 5)
