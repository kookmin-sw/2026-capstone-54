import unittest
from datetime import date, timedelta
from unittest.mock import patch

from django.test import TestCase
from streaks.factories import StreakStatisticsFactory
from streaks.models import StreakStatistics
from streaks.services import ExpireStreaksService
from users.factories import UserFactory


@unittest.skip("ExpireStreaksService 미구현 — 서비스 구현 후 활성화")
class ExpireStreaksServiceTests(TestCase):
  """ExpireStreaksService 테스트"""

  def setUp(self):
    self.today = date(2025, 3, 10)
    self.yesterday = self.today - timedelta(days=1)

  def _perform(self, today=None):
    target = today or self.today
    with patch("streaks.services.expire_streaks_service.timezone") as mock_tz:
      mock_tz.localdate.return_value = target
      return ExpireStreaksService(user=None).perform()

  def test_expire_streak_for_users_who_missed_yesterday(self):
    """
        어제 미참여자 스트릭 초기화 테스트

        어제 참여하지 않은 사용자의 current_streak이 0으로 초기화되는지 확인한다.
        - 이틀 전에 마지막 참여한 사용자 생성
        - 서비스 실행 후 current_streak이 0이 되는지 검증
        - 만료된 사용자 수가 1인지 검증
        """
    two_days_ago = self.today - timedelta(days=2)
    user = UserFactory()
    StreakStatisticsFactory(
      user=user,
      current_streak=5,
      last_participated_date=two_days_ago,
    )

    expired_count = self._perform()

    stats = StreakStatistics.objects.get(user=user)
    self.assertEqual(stats.current_streak, 0)
    self.assertEqual(expired_count, 1)

  def test_keep_streak_for_users_who_participated_yesterday(self):
    """
        어제 참여자 스트릭 유지 테스트

        어제 참여한 사용자의 current_streak은 초기화되지 않는지 확인한다.
        - 어제 참여한 사용자 생성
        - 서비스 실행 후에도 current_streak이 유지되는지 검증
        """
    user = UserFactory()
    StreakStatisticsFactory(
      user=user,
      current_streak=5,
      last_participated_date=self.yesterday,
    )

    self._perform()

    stats = StreakStatistics.objects.get(user=user)
    self.assertEqual(stats.current_streak, 5)

  def test_preserve_longest_streak_on_expiration(self):
    """
        longest_streak 보존 테스트

        스트릭 만료 시 longest_streak은 변경되지 않는지 확인한다.
        - current_streak=5, longest_streak=20인 사용자 생성
        - 만료 후에도 longest_streak이 20으로 유지되는지 검증
        """
    two_days_ago = self.today - timedelta(days=2)
    user = UserFactory()
    StreakStatisticsFactory(
      user=user,
      current_streak=5,
      longest_streak=20,
      last_participated_date=two_days_ago,
    )

    self._perform()

    stats = StreakStatistics.objects.get(user=user)
    self.assertEqual(stats.longest_streak, 20)

  def test_skip_users_with_zero_current_streak(self):
    """
        current_streak이 0인 사용자 스킵 테스트

        이미 current_streak=0인 사용자는 만료 처리에서 제외되는지 확인한다.
        - current_streak=0인 사용자 생성
        - 만료된 사용자 수가 0인지 검증
        """
    two_days_ago = self.today - timedelta(days=2)
    user = UserFactory()
    StreakStatisticsFactory(
      user=user,
      current_streak=0,
      last_participated_date=two_days_ago,
    )

    expired_count = self._perform()

    self.assertEqual(expired_count, 0)

  def test_keep_streak_for_users_who_participated_today(self):
    """
        오늘 참여자 스트릭 유지 테스트

        오늘 참여한 사용자의 current_streak은 초기화되지 않는지 확인한다.
        - 오늘 참여한 사용자 생성
        - 서비스 실행 후에도 current_streak이 유지되는지 검증
        """
    user = UserFactory()
    StreakStatisticsFactory(
      user=user,
      current_streak=3,
      last_participated_date=self.today,
    )

    self._perform()

    stats = StreakStatistics.objects.get(user=user)
    self.assertEqual(stats.current_streak, 3)

  def test_bulk_expire_multiple_users(self):
    """
        여러 사용자 일괄 만료 테스트

        여러 사용자의 스트릭을 한 번에 만료 처리하는지 확인한다.
        - 3명의 사용자 생성 (모두 이틀 전 마지막 참여)
        - 서비스 실행 후 3명 모두 current_streak이 0이 되는지 검증
        - 만료된 사용자 수가 3인지 검증
        """
    two_days_ago = self.today - timedelta(days=2)
    users = [UserFactory() for _ in range(3)]
    for user in users:
      StreakStatisticsFactory(
        user=user,
        current_streak=5,
        last_participated_date=two_days_ago,
      )

    expired_count = self._perform()

    self.assertEqual(expired_count, 3)
    for user in users:
      stats = StreakStatistics.objects.get(user=user)
      self.assertEqual(stats.current_streak, 0)
