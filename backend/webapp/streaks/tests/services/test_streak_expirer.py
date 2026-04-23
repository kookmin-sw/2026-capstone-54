from datetime import date, timedelta
from unittest.mock import patch

from django.test import TestCase
from streaks.factories import StreakStatisticsFactory
from streaks.models import StreakStatistics
from streaks.services import StreakExpirer
from users.factories import UserFactory


class StreakExpirerTests(TestCase):

  def setUp(self):
    self.user = UserFactory()
    self.today = date(2025, 3, 10)
    self.yesterday = self.today - timedelta(days=1)

  def _perform(self, user=None, today=None):
    target_user = user or self.user
    target_date = today or self.today
    with patch("streaks.services.streak_expirer.timezone.localdate") as mock_localdate:
      mock_localdate.return_value = target_date
      return StreakExpirer(target_user).execute()

  def test_no_expiration_when_user_participated_today(self):
    StreakStatisticsFactory(
      user=self.user,
      current_streak=5,
      last_participated_date=self.today,
    )
    result = self._perform()
    self.assertEqual(result["expired_count"], 0)

  def test_no_expiration_when_user_participated_yesterday(self):
    StreakStatisticsFactory(
      user=self.user,
      current_streak=5,
      last_participated_date=self.yesterday,
    )
    result = self._perform()
    self.assertEqual(result["expired_count"], 0)

  def test_expire_when_last_participation_before_yesterday(self):
    two_days_ago = self.today - timedelta(days=2)
    StreakStatisticsFactory(
      user=self.user,
      current_streak=5,
      last_participated_date=two_days_ago,
    )
    result = self._perform()
    self.assertEqual(result["expired_count"], 1)

    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 0)

  def test_expire_multiple_users(self):
    users = [UserFactory() for _ in range(3)]
    two_days_ago = self.today - timedelta(days=2)

    for user in users:
      StreakStatisticsFactory(
        user=user,
        current_streak=5,
        last_participated_date=two_days_ago,
      )

    result = self._perform(user=None)
    self.assertEqual(result["expired_count"], 3)

  def test_bulk_update_existing_statistics(self):
    StreakStatisticsFactory(
      user=self.user,
      current_streak=5,
      last_participated_date=self.yesterday - timedelta(days=2),
    )

    result = self._perform()
    self.assertEqual(result["expired_count"], 1)

    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 0)

  def test_expired_user_ids_returned(self):
    two_days_ago = self.today - timedelta(days=2)
    StreakStatisticsFactory(
      user=self.user,
      current_streak=5,
      last_participated_date=two_days_ago,
    )

    result = self._perform()
    self.assertIn(self.user.id, result["expired_user_ids"])
