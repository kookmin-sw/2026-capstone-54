import unittest
from datetime import date, timedelta
from unittest.mock import patch

from config.settings.base import MAX_REWARDED_INTERVIEWS_PER_DAY
from django.test import TestCase
from django.utils import timezone
from streaks.factories import (
  DailyInterviewRewardPolicyFactory,
  StreakStatisticsFactory,
)
from streaks.models import (
  StreakLog,
  StreakStatistics,
)
from streaks.services import RecordInterviewParticipationService
from tickets.models import UserTicket
from users.factories import UserFactory


@unittest.skip("RecordInterviewParticipationService 미구현 — 서비스 구현 후 활성화")
class RecordInterviewParticipationServiceTests(TestCase):
  """RecordInterviewParticipationService 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.today = date(2025, 3, 10)

  def _perform(self, today=None):
    target = today or self.today
    with patch("streaks.services.record_interview_participation_service.timezone") as mock_tz:
      mock_tz.localdate.return_value = target
      mock_tz.now.return_value = timezone.now()
      return RecordInterviewParticipationService(user=self.user).perform()

  # ── StreakLog ──────────────────────────────────────────────────────────────

  def test_create_streak_log_on_first_interview(self):
    """
        첫 면접 시 StreakLog 생성 테스트

        오늘 처음 면접을 진행할 때 StreakLog가 생성되는지 확인한다.
        - 서비스 실행
        - 오늘 날짜로 StreakLog가 존재하는지 검증
        """
    self._perform()
    self.assertTrue(StreakLog.objects.filter(user=self.user, date=self.today).exists())

  def test_increment_interview_count_on_same_day(self):
    """
        같은 날 면접 횟수 누적 테스트

        같은 날 두 번 호출하면 interview_results_count가 2가 되는지 확인한다.
        - 첫 번째 면접 기록
        - 두 번째 면접 기록
        - interview_results_count가 2인지 검증
        """
    self._perform()
    self._perform()
    log = StreakLog.objects.get(user=self.user, date=self.today)
    self.assertEqual(log.interview_results_count, 2)

  # ── StreakStatistics ───────────────────────────────────────────────────────

  def test_set_current_streak_to_one_on_first_participation(self):
    """
        첫 참여 시 current_streak 1 설정 테스트

        기존 스트릭이 없는 경우 current_streak이 1이 되는지 확인한다.
        - 서비스 실행
        - StreakStatistics의 current_streak이 1인지 검증
        """
    self._perform()
    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 1)

  def test_increment_current_streak_on_consecutive_participation(self):
    """
        연속 참여 시 current_streak 증가 테스트

        전날 참여 기록이 있으면 current_streak이 +1 되는지 확인한다.
        - 어제 참여한 사용자 생성 (current_streak=3)
        - 오늘 면접 기록
        - current_streak이 4가 되는지 검증
        """
    yesterday = self.today - timedelta(days=1)
    StreakStatisticsFactory(
      user=self.user,
      current_streak=3,
      longest_streak=3,
      last_participated_date=yesterday,
    )
    self._perform()
    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 4)

  def test_reset_current_streak_when_streak_broken(self):
    """
        연속 끊긴 경우 current_streak 리셋 테스트

        이틀 이상 공백이 있으면 current_streak이 1로 초기화되는지 확인한다.
        - 이틀 전에 마지막 참여한 사용자 생성 (current_streak=5)
        - 오늘 면접 기록
        - current_streak이 1로 리셋되는지 검증
        """
    two_days_ago = self.today - timedelta(days=2)
    StreakStatisticsFactory(
      user=self.user,
      current_streak=5,
      longest_streak=5,
      last_participated_date=two_days_ago,
    )
    self._perform()
    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.current_streak, 1)

  def test_update_longest_streak_when_exceeded(self):
    """
        longest_streak 갱신 테스트

        current_streak이 longest_streak을 초과하면 longest_streak이 갱신되는지 확인한다.
        - 어제 참여한 사용자 생성 (current_streak=7, longest_streak=7)
        - 오늘 면접 기록
        - longest_streak이 8로 갱신되는지 검증
        """
    yesterday = self.today - timedelta(days=1)
    StreakStatisticsFactory(
      user=self.user,
      current_streak=7,
      longest_streak=7,
      last_participated_date=yesterday,
    )
    self._perform()
    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.longest_streak, 8)

  def test_no_stats_change_on_second_interview_same_day(self):
    """
        같은 날 두 번째 참여 시 통계 변경 없음 테스트

        같은 날 두 번째 면접은 StreakStatistics를 변경하지 않는지 확인한다.
        - 첫 번째 면접 기록
        - current_streak 저장
        - 두 번째 면접 기록
        - current_streak이 변경되지 않았는지 검증
        """
    self._perform()
    stats_after_first = StreakStatistics.objects.get(user=self.user)
    streak_before = stats_after_first.current_streak
    self._perform()
    stats_after_second = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats_after_second.current_streak, streak_before)

  def test_update_last_participated_date_on_first_participation_of_day(self):
    """
        last_participated_date 갱신 테스트

        오늘 첫 참여 시 last_participated_date가 오늘로 업데이트되는지 확인한다.
        - 서비스 실행
        - last_participated_date가 오늘 날짜인지 검증
        """
    self._perform()
    stats = StreakStatistics.objects.get(user=self.user)
    self.assertEqual(stats.last_participated_date, self.today)

  # ── DailyInterviewRewardPolicy 티켓 지급 ──────────────────────────────────

  def test_grant_ticket_for_first_interview(self):
    """
        첫 번째 면접 티켓 지급 테스트

        첫 번째 면접에 해당 정책이 있으면 티켓이 지급되는지 확인한다.
        - 1번째 면접 정책 생성 (5개 티켓)
        - 서비스 실행
        - UserTicket의 count가 5인지 검증
        """
    DailyInterviewRewardPolicyFactory(interview_order=1, ticket_reward=5)
    self._perform()
    ticket = UserTicket.objects.get(user=self.user)
    self.assertEqual(ticket.purchased_count, 5)

  def test_grant_ticket_for_second_interview(self):
    """
        두 번째 면접 티켓 지급 테스트

        두 번째 면접에 해당 정책이 있으면 티켓이 추가 지급되는지 확인한다.
        - 1번째, 2번째 면접 정책 생성 (5개, 3개 티켓)
        - 두 번 서비스 실행
        - UserTicket의 count가 8(5+3)인지 검증
        """
    DailyInterviewRewardPolicyFactory(interview_order=1, ticket_reward=5)
    DailyInterviewRewardPolicyFactory(interview_order=2, ticket_reward=3)
    self._perform()
    self._perform()
    ticket = UserTicket.objects.get(user=self.user)
    self.assertEqual(ticket.purchased_count, 8)

  def test_no_ticket_grant_beyond_max_rewarded_interviews(self):
    """
        최대 보상 횟수 초과 시 티켓 미지급 테스트

        MAX_REWARDED_INTERVIEWS_PER_DAY 초과 면접은 티켓이 지급되지 않는지 확인한다.
        - 최대 보상 횟수만큼 정책 생성 (각 1개 티켓)
        - 최대 횟수 + 1번 서비스 실행
        - UserTicket의 count가 최대 횟수와 같은지 검증
        """
    for i in range(1, MAX_REWARDED_INTERVIEWS_PER_DAY + 1):
      DailyInterviewRewardPolicyFactory(interview_order=i, ticket_reward=1)

    for _ in range(MAX_REWARDED_INTERVIEWS_PER_DAY + 1):
      self._perform()

    ticket = UserTicket.objects.get(user=self.user)
    self.assertEqual(ticket.purchased_count, MAX_REWARDED_INTERVIEWS_PER_DAY)

  def test_no_ticket_grant_for_inactive_policy(self):
    """
        비활성 정책 티켓 미지급 테스트

        is_active=False 정책은 티켓을 지급하지 않는지 확인한다.
        - 비활성 정책 생성 (5개 티켓)
        - 서비스 실행
        - UserTicket이 생성되지 않았는지 검증
        """
    DailyInterviewRewardPolicyFactory(interview_order=1, ticket_reward=5, is_active=False)
    self._perform()
    self.assertFalse(UserTicket.objects.filter(user=self.user).exists())
