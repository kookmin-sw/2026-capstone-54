"""
Celery 앱 설정 — store-resume worker.

이력서 처리 파이프라인(텍스트 추출 → 임베딩 → LLM 분석)을
비동기 태스크로 실행합니다.

실행 예시:
    celery -A app.celery_app worker -Q store-resume -l INFO --concurrency 2
"""

from app import config
from celery import Celery

app = Celery("store_resume")
app.conf.update(
  broker_url=config.CELERY_BROKER_URL,
  result_backend=config.CELERY_RESULT_BACKEND,
  task_serializer="json",
  result_serializer="json",
  accept_content=["json"],
  task_default_queue="store-resume",
  worker_prefetch_multiplier=1,
  task_acks_late=True,
  task_soft_time_limit=300,
  task_time_limit=360,
  result_expires=3600,
  include=[
    "app.tasks.extract_text",
    "app.tasks.embed_resume",
    "app.tasks.analyze_resume",
    "app.tasks.finalize_resume",
    "app.tasks.process_resume",
  ],
)
