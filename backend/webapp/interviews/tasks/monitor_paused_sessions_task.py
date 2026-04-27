"""IN_PROGRESS 세션의 heartbeat timeout 감지 + PAUSED 세션의 idle 자동 종료 태스크."""

from datetime import timedelta

from celery.schedules import crontab
from common.tasks.base_scheduled_task import BaseScheduledTask
from config.celery import app
from django.utils import timezone
from interviews.enums import InterviewSessionStatus
from interviews.models import InterviewSession

HEARTBEAT_TIMEOUT = timedelta(seconds=120)
PAUSED_AUTO_FINISH_THRESHOLD = timedelta(minutes=30)


class MonitorPausedSessionsTask(BaseScheduledTask):
  """5 분 주기로 heartbeat timeout 감지 + 장기 PAUSED 세션 자동 종료를 수행한다."""

  schedule = crontab(minute="*/5")

  def run(self):
    now = timezone.now()
    timed_out_count = self._mark_heartbeat_timeout_as_paused(now)
    auto_finished_count = self._mark_long_paused_as_completed(now)
    return {
      "heartbeat_timeout_paused": timed_out_count,
      "long_paused_auto_finished": auto_finished_count,
    }

  @staticmethod
  def _mark_heartbeat_timeout_as_paused(now) -> int:
    cutoff = now - HEARTBEAT_TIMEOUT
    candidates = InterviewSession.objects.filter(
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      last_heartbeat_at__isnull=False,
      last_heartbeat_at__lt=cutoff,
    )
    paused_count = 0
    for session in candidates.iterator():
      session.mark_paused(reason="heartbeat_timeout")
      paused_count += 1
    return paused_count

  @staticmethod
  def _mark_long_paused_as_completed(now) -> int:
    cutoff = now - PAUSED_AUTO_FINISH_THRESHOLD
    candidates = InterviewSession.objects.filter(
      interview_session_status=InterviewSessionStatus.PAUSED,
      paused_at__isnull=False,
      paused_at__lt=cutoff,
    )
    finished_count = 0
    for session in candidates.iterator():
      session.mark_completed()
      finished_count += 1
    return finished_count


RegisteredMonitorPausedSessionsTask = app.register_task(MonitorPausedSessionsTask())
