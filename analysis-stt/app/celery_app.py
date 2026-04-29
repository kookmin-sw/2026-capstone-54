"""Celery 앱 — analysis-stt worker.

audio S3 다운로드 → faster-whisper STT → backend 의 save_transcript_result_task 콜백.

실행 예시:
    celery -A app.celery_app worker -Q analysis-stt -l INFO --concurrency 2
"""

from app import config
from celery import Celery

app = Celery("analysis_stt")
app.conf.update(
  broker_url=config.CELERY_BROKER_URL,
  result_backend=config.CELERY_RESULT_BACKEND,
  task_serializer="json",
  result_serializer="json",
  accept_content=["json"],
  task_default_queue="analysis-stt",
  worker_prefetch_multiplier=1,
  task_acks_late=True,
  task_soft_time_limit=600,
  task_time_limit=720,
  result_expires=3600,
  worker_send_task_events=True,
  task_send_sent_event=True,
  include=[
    "app.tasks.transcribe_audio",
  ],
)
