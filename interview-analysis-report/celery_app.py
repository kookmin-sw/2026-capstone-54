"""
Celery 앱 설정 — interview-analysis-report worker.

면접 분석 리포트 생성을 비동기 태스크로 실행합니다.

실행 예시:
    celery -A celery_app worker -Q analysis -l INFO --concurrency 2
"""

import config
from celery import Celery

app = Celery("analysis")
app.conf.update(
    broker_url=config.CELERY_BROKER_URL,
    result_backend=config.CELERY_RESULT_BACKEND,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_default_queue="analysis",
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_soft_time_limit=300,
    task_time_limit=360,
    result_expires=3600,
    include=["tasks.generate_report"],
)
