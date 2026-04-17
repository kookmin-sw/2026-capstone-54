"""
Celery Beat 주기적 작업 스케줄 설정.

등록 방법은 webapp/common/tasks/README.md 를 참고한다.

주의: settings 파일에서 태스크 클래스를 직접 import 하면 순환 참조가 발생한다.
      태스크는 반드시 문자열(모듈 경로)로 참조해야 한다.
"""

from celery.schedules import crontab

# Celery Beat 스케줄 설정
CELERY_BEAT_SCHEDULE = {
  #  Example
  #   "common.tasks.ping_task.RegisteredPingScheduledTask": {
  #     "task": "common.tasks.ping_task.RegisteredPingScheduledTask",
  #     "schedule": crontab(minute="*"),
  #     "args": (),
  #     "kwargs": {},
  #     "options": {},
  #   },

  # 구독 플랜 일일 티켓 지급 (KST 00:00 = UTC 15:00)
  "subscriptions.tasks.grant_daily_subscription_tickets_task.RegisteredGrantDailySubscriptionTicketsTask": {
    "task": "subscriptions.tasks.grant_daily_subscription_tickets_task.RegisteredGrantDailySubscriptionTicketsTask",
    "schedule": crontab(hour=0, minute=0),
    "args": (),
    "kwargs": {},
    "options": {},
  },
}

__all__ = [
  "CELERY_BEAT_SCHEDULE",
]
