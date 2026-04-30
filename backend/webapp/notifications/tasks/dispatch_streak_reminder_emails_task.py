from celery.schedules import crontab
from common.tasks.base_scheduled_task import BaseScheduledTask
from config.celery import app
from django.utils import timezone


class DispatchStreakReminderEmailsTask(BaseScheduledTask):
  """KST 20:00 — 오늘 면접 연습을 아직 하지 않은 동의자에게 리마인더 발송.

  대상 조건:
    - UserEmailNotificationSettings.streak_reminder 동의 상태 (opted_in_at >= opted_out_at).
    - StreakStatistics.last_participated_date != 오늘 (None 포함).

  처리 방식:
    대상자별로 SendStreakReminderEmailTask 를 비동기로 enqueue 하여 부하를 분산한다.
  """

  schedule = crontab(hour=20, minute=0)

  def run(self):
    from notifications.models import UserEmailNotificationSettings

    from .send_streak_reminder_email_task import RegisteredSendStreakReminderEmailTask

    today = timezone.localdate()

    queryset = UserEmailNotificationSettings.objects.select_related("user", "user__streak_statistic").filter(
      streak_reminder_opted_in_at__isnull=False,
    )

    enqueued = 0
    for settings in queryset.iterator(chunk_size=500):
      if not settings.is_opted_in("streak_reminder"):
        continue

      user = settings.user
      if not user.is_active or not user.email:
        continue

      stats = getattr(user, "streak_statistic", None)
      if stats is not None and stats.last_participated_date == today:
        continue

      RegisteredSendStreakReminderEmailTask.delay(user_id=user.id)
      enqueued += 1

    return {"enqueued": enqueued}


RegisteredDispatchStreakReminderEmailsTask = app.register_task(DispatchStreakReminderEmailsTask())
