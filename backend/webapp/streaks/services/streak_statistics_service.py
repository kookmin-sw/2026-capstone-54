from common.services import BaseService
from config.settings.base import (
  MAX_REWARDED_INTERVIEWS_PER_DAY,
  TICKET_REWARD_PER_INTERVIEW_ORDER,
)
from django.db import transaction
from streaks.signals import interview_completed, streak_expired


class StreakStatisticsService(BaseService):
  """스트릭 통계 관리 통합 서비스.

    단일 책임:
    - record_participation: 면접 참여 기록 + 통계 갱신 + 티켓
    - recalculate: 통계 재계산
    - expire_streaks: 스트릭 만료
    """

  def execute(self):
    raise NotImplementedError("Use specific method instead of execute()")

  def record_participation(self):
    from tickets.services import GrantTicketsService

    from .streak_calculator import StreakCalculator
    from .streak_log_manager import StreakLogManager

    log_manager = StreakLogManager(self.user)
    streak_log = log_manager.increment()

    calculator = StreakCalculator(self.user)
    stats = calculator.calculate()
    stats.save()

    if streak_log.interview_results_count <= MAX_REWARDED_INTERVIEWS_PER_DAY:
      reward = TICKET_REWARD_PER_INTERVIEW_ORDER[streak_log.interview_results_count]
      if reward > 0:
        GrantTicketsService(user=self.user, amount=reward).perform()

    transaction.on_commit(
      lambda: interview_completed.send(
        sender=self.__class__,
        user=self.user,
        streak_log=streak_log,
      )
    )

    return stats

  def recalculate(self):
    from .streak_calculator import StreakCalculator

    calculator = StreakCalculator(self.user)
    stats = calculator.calculate()
    stats.save()
    return stats

  def expire_streaks(self):
    from .streak_expirer import StreakExpirer

    expirer = StreakExpirer(self.user)
    result = expirer.execute()

    if result["expired_count"] > 0:
      transaction.on_commit(
        lambda: streak_expired.send(
          sender=self.__class__,
          expired_user_ids=result["expired_user_ids"],
        )
      )

    return result
