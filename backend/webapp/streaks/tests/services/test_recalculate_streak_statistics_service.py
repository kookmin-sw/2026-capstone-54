from datetime import date, timedelta
from unittest.mock import patch

from django.test import TestCase
from streaks.factories import StreakLogFactory, StreakStatisticsFactory
from streaks.models import StreakStatistics
from streaks.services import RecalculateStreakStatisticsService
from users.factories import UserFactory


class RecalculateStreakStatisticsServiceTests(TestCase):
  """RecalculateStreakStatisticsService 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.today = date(2025, 3, 10)

  def _perform_single_user(self, user=None, today=None):
    """단일 사용자 재계산 헬퍼"""
    target_user = user or self.user
    target_date = today or self.today
    with patch("streaks.services.recalculate_streak_statistics_service.timezone") as mock_timezone:
      mock_timezone.localdate.return_value = target_date
      return RecalculateStreakStatisticsService(user=target_user).perform()

  def _perform_multiple_users(self, user_ids=None, today=None):
    """다중 사용자 재계산 헬퍼"""
    target_date = today or self.today
    with patch("streaks.services.recalculate_streak_statistics_service.timezone") as mock_timezone:
      mock_timezone.localdate.return_value = target_date
      return RecalculateStreakStatisticsService(user_ids=user_ids).perform()

  # ── 단일 사용자: 로그 없음 ──────────────────────────────────────────────────

  def test_initialize_statistics_when_no_logs_exist(self):
    """
    로그 없을 때 통계 초기화 테스트

    StreakLog가 없는 사용자의 통계가 0으로 초기화되는지 확인한다.
    - StreakLog 없이 서비스 실행
    - current_streak, longest_streak이 0인지 검증
    - last_participated_date가 None인지 검증
    """
    streak_statistic = self._perform_single_user()

    self.assertEqual(streak_statistic.current_streak, 0)
    self.assertEqual(streak_statistic.longest_streak, 0)
    self.assertIsNone(streak_statistic.last_participated_date)

  def test_create_new_statistics_when_not_exists(self):
    """
    통계 레코드 없을 때 생성 테스트

    StreakStatistics가 없는 사용자에 대해 새로 생성되는지 확인한다.
    - 기존 StreakStatistics 없이 서비스 실행
    - StreakStatistics가 생성되었는지 검증
    """
    self.assertFalse(StreakStatistics.objects.filter(user=self.user).exists())

    self._perform_single_user()

    self.assertTrue(StreakStatistics.objects.filter(user=self.user).exists())

  # ── 단일 사용자: 단일 로그 ──────────────────────────────────────────────────

  def test_calculate_streak_with_single_log_today(self):
    """
    오늘 하루 로그만 있을 때 계산 테스트

    오늘 날짜의 로그 하나만 있을 때 current_streak이 1이 되는지 확인한다.
    - 오늘 날짜 로그 생성
    - 서비스 실행
    - current_streak, longest_streak이 1인지 검증
    """
    StreakLogFactory(user=self.user, date=self.today)

    streak_statistic = self._perform_single_user()

    self.assertEqual(streak_statistic.current_streak, 1)
    self.assertEqual(streak_statistic.longest_streak, 1)
    self.assertEqual(streak_statistic.last_participated_date, self.today)

  def test_reset_current_streak_when_last_log_is_old(self):
    """
    오래된 로그만 있을 때 current_streak 리셋 테스트

    이틀 이상 지난 로그만 있을 때 current_streak이 0이 되는지 확인한다.
    - 3일 전 로그 생성
    - 서비스 실행
    - current_streak이 0인지 검증
    - longest_streak은 1인지 검증 (과거 기록)
    """
    three_days_ago = self.today - timedelta(days=3)
    StreakLogFactory(user=self.user, date=three_days_ago)

    streak_statistic = self._perform_single_user()

    self.assertEqual(streak_statistic.current_streak, 0)
    self.assertEqual(streak_statistic.longest_streak, 1)
    self.assertEqual(streak_statistic.last_participated_date, three_days_ago)

  # ── 단일 사용자: 연속 로그 ──────────────────────────────────────────────────

  def test_calculate_consecutive_streak(self):
    """
    연속된 로그 계산 테스트

    연속된 날짜의 로그들이 올바르게 계산되는지 확인한다.
    - 5일 연속 로그 생성 (오늘까지)
    - 서비스 실행
    - current_streak, longest_streak이 5인지 검증
    """
    for days_ago in range(4, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date)

    streak_statistic = self._perform_single_user()

    self.assertEqual(streak_statistic.current_streak, 5)
    self.assertEqual(streak_statistic.longest_streak, 5)

  def test_calculate_streak_ending_yesterday(self):
    """
    어제까지 연속 로그 계산 테스트

    어제까지 연속된 로그가 있을 때 current_streak이 유지되는지 확인한다.
    - 어제까지 3일 연속 로그 생성
    - 서비스 실행
    - current_streak이 3인지 검증
    """
    yesterday = self.today - timedelta(days=1)
    for days_ago in range(2, -1, -1):
      log_date = yesterday - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date)

    streak_statistic = self._perform_single_user()

    self.assertEqual(streak_statistic.current_streak, 3)
    self.assertEqual(streak_statistic.longest_streak, 3)

  # ── 단일 사용자: 끊긴 로그 ──────────────────────────────────────────────────

  def test_calculate_streak_with_gap(self):
    """
    중간에 끊긴 로그 계산 테스트

    중간에 공백이 있는 로그들에서 longest_streak을 올바르게 계산하는지 확인한다.
    - 5일 연속 로그 (10일 전부터)
    - 3일 공백
    - 3일 연속 로그 (오늘까지)
    - longest_streak이 5, current_streak이 3인지 검증
    """
    # 첫 번째 연속: 5일 (10일 전부터 6일 전까지)
    for days_ago in range(10, 5, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date)

    # 두 번째 연속: 3일 (오늘까지)
    for days_ago in range(2, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date)

    streak_statistic = self._perform_single_user()

    self.assertEqual(streak_statistic.current_streak, 3)
    self.assertEqual(streak_statistic.longest_streak, 5)

  def test_calculate_multiple_streaks_with_current_longest(self):
    """
    여러 구간 중 현재 구간이 최장인 경우 테스트

    여러 연속 구간이 있고 현재 구간이 가장 길 때 올바르게 계산되는지 확인한다.
    - 3일 연속 로그 (10일 전부터)
    - 공백
    - 7일 연속 로그 (오늘까지)
    - longest_streak과 current_streak이 모두 7인지 검증
    """
    # 첫 번째 연속: 3일
    for days_ago in range(10, 7, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date)

    # 두 번째 연속: 7일 (오늘까지)
    for days_ago in range(6, -1, -1):
      log_date = self.today - timedelta(days=days_ago)
      StreakLogFactory(user=self.user, date=log_date)

    streak_statistic = self._perform_single_user()

    self.assertEqual(streak_statistic.current_streak, 7)
    self.assertEqual(streak_statistic.longest_streak, 7)

  # ── 단일 사용자: 기존 통계 업데이트 ──────────────────────────────────────────

  def test_update_existing_statistics(self):
    """
    기존 통계 업데이트 테스트

    이미 StreakStatistics가 있는 경우 업데이트되는지 확인한다.
    - 잘못된 값의 기존 통계 생성
    - 올바른 로그 생성
    - 서비스 실행 후 통계가 올바르게 업데이트되는지 검증
    """
    StreakStatisticsFactory(
      user=self.user, current_streak=999, longest_streak=999, last_participated_date=self.today - timedelta(days=100)
    )
    StreakLogFactory(user=self.user, date=self.today)

    streak_statistic = self._perform_single_user()

    self.assertEqual(streak_statistic.current_streak, 1)
    self.assertEqual(streak_statistic.longest_streak, 1)
    self.assertEqual(streak_statistic.last_participated_date, self.today)

  # ── 다중 사용자: 기본 동작 ──────────────────────────────────────────────────

  def test_recalculate_multiple_users_with_user_ids(self):
    """
    지정된 사용자들 재계산 테스트

    user_ids로 지정된 사용자들의 통계가 재계산되는지 확인한다.
    - 3명의 사용자 생성 및 로그 추가
    - user_ids로 서비스 실행
    - success_count가 3인지 검증
    - 각 사용자의 통계가 올바른지 검증
    """
    users = [UserFactory() for _ in range(3)]
    for index, user in enumerate(users):
      # 각 사용자마다 다른 연속 일수
      for days_ago in range(index + 1, -1, -1):
        log_date = self.today - timedelta(days=days_ago)
        StreakLogFactory(user=user, date=log_date)

    user_ids = [user.id for user in users]
    result = self._perform_multiple_users(user_ids=user_ids)

    self.assertEqual(result["success_count"], 3)
    self.assertEqual(result["error_count"], 0)
    self.assertEqual(len(result["updated_stats"]), 3)

    for index, user in enumerate(users):
      streak_statistic = StreakStatistics.objects.get(user=user)
      expected_streak = index + 1
      self.assertEqual(streak_statistic.current_streak, expected_streak)

  def test_create_statistics_for_users_without_existing_record(self):
    """
    통계 없는 사용자들 생성 테스트

    StreakStatistics가 없는 사용자들에 대해 새로 생성되는지 확인한다.
    - 통계 없는 2명의 사용자 생성
    - 서비스 실행
    - 2명 모두 StreakStatistics가 생성되었는지 검증
    """
    users = [UserFactory() for _ in range(2)]
    for user in users:
      StreakLogFactory(user=user, date=self.today)

    user_ids = [user.id for user in users]
    self._perform_multiple_users(user_ids=user_ids)

    for user in users:
      self.assertTrue(StreakStatistics.objects.filter(user=user).exists())

  def test_update_existing_statistics_for_multiple_users(self):
    """
    기존 통계 있는 사용자들 업데이트 테스트

    이미 StreakStatistics가 있는 사용자들의 통계가 업데이트되는지 확인한다.
    - 잘못된 통계를 가진 2명의 사용자 생성
    - 올바른 로그 추가
    - 서비스 실행 후 통계가 올바르게 업데이트되는지 검증
    """
    users = [UserFactory() for _ in range(2)]
    for user in users:
      StreakStatisticsFactory(user=user, current_streak=999, longest_streak=999)
      StreakLogFactory(user=user, date=self.today)

    user_ids = [user.id for user in users]
    self._perform_multiple_users(user_ids=user_ids)

    for user in users:
      streak_statistic = StreakStatistics.objects.get(user=user)
      self.assertEqual(streak_statistic.current_streak, 1)
      self.assertEqual(streak_statistic.longest_streak, 1)

  # ── 다중 사용자: 에러 처리 ──────────────────────────────────────────────────

  def test_handle_errors_gracefully_for_multiple_users(self):
    """
    다중 사용자 처리 중 에러 처리 테스트

    일부 사용자 처리 중 에러가 발생해도 다른 사용자는 정상 처리되는지 확인한다.
    - 정상 사용자 2명, 에러 발생 사용자 1명 설정
    - 서비스 실행
    - success_count가 2, error_count가 1인지 검증
    """
    normal_users = [UserFactory() for _ in range(2)]
    for user in normal_users:
      StreakLogFactory(user=user, date=self.today)

    # 존재하지 않는 사용자 ID 추가 (에러 발생 예상)
    invalid_user_id = 999999
    user_ids = [user.id for user in normal_users] + [invalid_user_id]

    result = self._perform_multiple_users(user_ids=user_ids)

    self.assertEqual(result["success_count"], 2)
    self.assertEqual(result["error_count"], 1)

  # ── 다중 사용자: Bulk 연산 ──────────────────────────────────────────────────

  def test_bulk_create_new_statistics(self):
    """
    Bulk create 테스트

    통계가 없는 여러 사용자에 대해 bulk_create가 사용되는지 확인한다.
    - 통계 없는 3명의 사용자 생성
    - 서비스 실행
    - 3명 모두 StreakStatistics가 생성되었는지 검증
    """
    users = [UserFactory() for _ in range(3)]
    for user in users:
      StreakLogFactory(user=user, date=self.today)

    user_ids = [user.id for user in users]
    self._perform_multiple_users(user_ids=user_ids)

    created_count = StreakStatistics.objects.filter(user__in=users).count()
    self.assertEqual(created_count, 3)

  def test_bulk_update_existing_statistics(self):
    """
    Bulk update 테스트

    기존 통계가 있는 여러 사용자에 대해 bulk_update가 사용되는지 확인한다.
    - 기존 통계가 있는 3명의 사용자 생성
    - 서비스 실행
    - 3명 모두 통계가 업데이트되었는지 검증
    """
    users = [UserFactory() for _ in range(3)]
    for user in users:
      StreakStatisticsFactory(user=user, current_streak=0, longest_streak=0)
      StreakLogFactory(user=user, date=self.today)

    user_ids = [user.id for user in users]
    self._perform_multiple_users(user_ids=user_ids)

    for user in users:
      streak_statistic = StreakStatistics.objects.get(user=user)
      self.assertEqual(streak_statistic.current_streak, 1)

  def test_mixed_create_and_update_operations(self):
    """
    생성과 업데이트 혼합 테스트

    통계가 있는 사용자와 없는 사용자가 섞여 있을 때 올바르게 처리되는지 확인한다.
    - 기존 통계 있는 사용자 2명
    - 기존 통계 없는 사용자 2명
    - 서비스 실행
    - 4명 모두 올바른 통계를 가지는지 검증
    """
    users_with_stats = [UserFactory() for _ in range(2)]
    users_without_stats = [UserFactory() for _ in range(2)]

    for user in users_with_stats:
      StreakStatisticsFactory(user=user, current_streak=0, longest_streak=0)
      StreakLogFactory(user=user, date=self.today)

    for user in users_without_stats:
      StreakLogFactory(user=user, date=self.today)

    all_users = users_with_stats + users_without_stats
    user_ids = [user.id for user in all_users]
    result = self._perform_multiple_users(user_ids=user_ids)

    self.assertEqual(result["success_count"], 4)
    for user in all_users:
      streak_statistic = StreakStatistics.objects.get(user=user)
      self.assertEqual(streak_statistic.current_streak, 1)
