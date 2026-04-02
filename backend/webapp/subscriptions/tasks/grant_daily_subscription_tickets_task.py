"""
구독 플랜별 일일 티켓 지급 태스크.

매일 KST 00:00 (UTC 15:00)에 실행되며,
활성 구독 정책에 따라 해당 사용자에게 티켓을 지급한다.
"""

from celery.schedules import crontab
from common.tasks.base_scheduled_task import BaseScheduledTask
from config.celery import app


class GrantDailySubscriptionTicketsTask(BaseScheduledTask):
  """활성 구독 중인 사용자에게 일일 티켓을 지급한다. KST 00:00 실행."""

  # KST 00:00 = UTC 15:00
  schedule = crontab(hour=15, minute=0)

  def run(self):
    from subscriptions.services import GrantDailySubscriptionTicketsService

    return GrantDailySubscriptionTicketsService().perform()


RegisteredGrantDailySubscriptionTicketsTask = app.register_task(GrantDailySubscriptionTicketsTask())
