"""
스트릭 만료 태스크.

매일 KST 02:00 (UTC 17:00)에 실행되며,
전날 참여 기록이 없는 사용자의 current_streak을 0으로 만료 처리한다.
"""

from celery.schedules import crontab
from common.tasks.base_scheduled_task import BaseScheduledTask
from config.celery import app


class ExpireStreaksTask(BaseScheduledTask):
  """스트릭 만료 배치. KST 02:00 실행."""

  schedule = crontab(hour=2, minute=0)

  def run(self):
    from streaks.services import StreakStatisticsService

    return StreakStatisticsService(user=None).expire_streaks()


RegisteredExpireStreaksTask = app.register_task(ExpireStreaksTask())
