from datetime import timedelta

from common.services import BaseService
from config.settings.base import (
  MAX_REWARDED_INTERVIEWS_PER_DAY,
  TICKET_REWARD_PER_INTERVIEW_ORDER,
)
from django.db import transaction
from django.utils import timezone
from streaks.signals import interview_completed


class RecordInterviewParticipationService(BaseService):
  """면접 완료 시 스트릭을 적립하고 티켓을 지급한다.

    처리 순서:
    1. 오늘 날짜의 StreakLog를 생성하거나 interview_results_count를 증가시킨다.
    2. StreakStatistics를 갱신한다 (오늘 첫 참여인 경우 current_streak 증가).
    3. TICKET_REWARD_PER_INTERVIEW_ORDER에 따라 인터뷰 순서별 티켓을 지급한다.
    """

  def execute(self):
    from streaks.models import StreakLog, StreakStatistics
    from tickets.services import GrantTicketsService

    today = timezone.localdate()

    # 1. StreakLog 갱신
    streak_log, created = StreakLog.objects.get_or_create(
      user=self.user,
      date=today,
      defaults={"interview_results_count": 0},
    )
    streak_log.interview_results_count += 1
    streak_log.save(update_fields=["interview_results_count", "updated_at"])

    # 2. StreakStatistics 갱신 (오늘 첫 참여인 경우에만)
    stats, _ = StreakStatistics.objects.get_or_create(user=self.user)
    is_first_today = created

    if is_first_today:
      yesterday = today - timedelta(days=1)
      if stats.last_participated_date == yesterday:
        stats.current_streak += 1
      else:
        stats.current_streak = 1

      if stats.current_streak > stats.longest_streak:
        stats.longest_streak = stats.current_streak

      stats.last_participated_date = today
      stats.save(update_fields=[
        "current_streak",
        "longest_streak",
        "last_participated_date",
        "updated_at",
      ])

    # 3. 일일 인터뷰 순서별 티켓 지급
    interview_order = streak_log.interview_results_count
    if interview_order <= MAX_REWARDED_INTERVIEWS_PER_DAY:
      ticket_reward = TICKET_REWARD_PER_INTERVIEW_ORDER[interview_order]
      if ticket_reward > 0:
        GrantTicketsService(
          user=self.user,
          amount=ticket_reward,
        ).perform()

    # 도메인 이벤트 발행 — 구독자(achievements 등)가 on_commit 이후 비동기 처리
    transaction.on_commit(
      lambda: interview_completed.send(
        sender=self.__class__,
        user=self.user,
        streak_log=streak_log,
      )
    )

    return stats
