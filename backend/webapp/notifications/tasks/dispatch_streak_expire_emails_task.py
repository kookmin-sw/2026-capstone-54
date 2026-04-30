from celery.schedules import crontab
from common.tasks.base_scheduled_task import BaseScheduledTask
from config.celery import app
from django.utils import timezone


class DispatchStreakExpireEmailsTask(BaseScheduledTask):
  """KST 23:00 — 오늘 자정까지 면접을 안 하면 스트릭이 끊길 동의자에게 만료 경고 발송.

  대상 조건:
    - UserEmailNotificationSettings.streak_expire 동의 상태.
    - StreakStatistics.current_streak > 0.
    - StreakStatistics.last_participated_date != 오늘 (= 어제까지만 참여).

  처리 방식:
    대상자별로 SendStreakExpireEmailTask 를 비동기로 enqueue 하여 부하를 분산한다.
  """

  schedule = crontab(hour=23, minute=0)

  def run(self):
    from notifications.models import UserEmailNotificationSettings

    from .send_streak_expire_email_task import RegisteredSendStreakExpireEmailTask

    today = timezone.localdate()

    queryset = UserEmailNotificationSettings.objects.select_related("user", "user__streak_statistic").filter(
      streak_expire_opted_in_at__isnull=False,
      user__is_active=True,
    ).exclude(user__email="")

    enqueued = 0
    for settings in queryset.iterator(chunk_size=500):
      if not settings.is_opted_in("streak_expire"):
        continue

      user = settings.user
      stats = getattr(user, "streak_statistic", None)
      if stats is None or stats.current_streak <= 0:
        continue
      if stats.last_participated_date == today:
        continue

      RegisteredSendStreakExpireEmailTask.delay(
        user_id=user.id,
        current_streak=stats.current_streak,
      )
      enqueued += 1

    return {"enqueued": enqueued}


RegisteredDispatchStreakExpireEmailsTask = app.register_task(DispatchStreakExpireEmailsTask())
