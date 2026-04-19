"""
오래된 녹화 레코드를 ABANDONED 상태로 전환하는 Celery 태스크.

INITIATED 또는 UPLOADING 상태로 1시간 이상 머물러 있는 녹화를
ABANDONED 으로 일괄 업데이트한다. 30분마다 실행된다.
"""

from datetime import timedelta

from celery.schedules import crontab
from common.tasks.base_scheduled_task import BaseScheduledTask
from config.celery import app
from django.utils import timezone
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording

STALE_THRESHOLD = timedelta(hours=1)


class CleanupStaleRecordingsTask(BaseScheduledTask):
  """1시간 이상 INITIATED/UPLOADING 상태인 녹화를 ABANDONED 으로 전환한다. 30분마다 실행."""

  schedule = crontab(minute="*/30")

  def run(self):
    cutoff = timezone.now() - STALE_THRESHOLD
    stale_recordings = InterviewRecording.objects.filter(
      status__in=[RecordingStatus.INITIATED, RecordingStatus.UPLOADING],
      created_at__lt=cutoff,
    )
    count = stale_recordings.update(status=RecordingStatus.ABANDONED)
    return {"abandoned_count": count}


RegisteredCleanupStaleRecordingsTask = app.register_task(CleanupStaleRecordingsTask())
