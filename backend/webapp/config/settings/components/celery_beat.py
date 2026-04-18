"""
Celery Beat 주기적 작업 스케줄 설정.

등록 방법은 webapp/common/tasks/README.md 를 참고한다.

주의:
  1. settings 파일에서 태스크 클래스를 직접 import 하면 순환 참조가 발생한다.
     태스크는 반드시 문자열(모듈 경로)로 참조해야 한다.
  2. Celery 는 `app.register_task(MyTask())` 시점의 클래스 기반 메타데이터로
     태스크 이름을 `<module>.<ClassName>` 형태로 자동 생성한다.
     따라서 아래 "task" 값은 **클래스 이름** 을 사용해야 한다.
     `Registered...` 접두사는 Python 변수명일 뿐 태스크 레지스트리 키가 아니다.
     (예: 올바름 → "subscriptions.tasks.xxx_task.GrantDailySubscriptionTicketsTask")
"""

from celery.schedules import crontab

# Celery Beat 스케줄 설정
CELERY_BEAT_SCHEDULE = {
  #  Example
  #   "common.tasks.ping_task.PingScheduledTask": {
  #     "task": "common.tasks.ping_task.PingScheduledTask",
  #     "schedule": crontab(minute="*"),
  #     "args": (),
  #     "kwargs": {},
  #     "options": {},
  #   },
  # 구독 플랜 일일 티켓 지급 (KST 00:00 = UTC 15:00)
  "subscriptions.tasks.grant_daily_subscription_tickets_task.GrantDailySubscriptionTicketsTask": {
    "task": "subscriptions.tasks.grant_daily_subscription_tickets_task.GrantDailySubscriptionTicketsTask",
    "schedule": crontab(hour=0, minute=0),
    "args": (),
    "kwargs": {},
    "options": {},
  },
  # 고아 녹화 정리 (30분마다)
  "interviews.tasks.cleanup_stale_recordings_task.CleanupStaleRecordingsTask": {
    "task": "interviews.tasks.cleanup_stale_recordings_task.CleanupStaleRecordingsTask",
    "schedule": crontab(minute="*/30"),
    "args": (),
    "kwargs": {},
    "options": {},
  },
}

__all__ = [
  "CELERY_BEAT_SCHEDULE",
]
