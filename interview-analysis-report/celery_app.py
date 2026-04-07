"""
Celery 앱 설정.

analysis 큐를 기본 큐로 사용하며, tasks 패키지에서 태스크를 자동 검색한다.

실행 예시:
    celery -A celery_app worker -Q analysis -l INFO
"""

from celery import Celery

from config import REDIS_URL

app = Celery("analysis")
app.conf.update(
    broker_url=REDIS_URL,
    result_backend=REDIS_URL,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_default_queue="analysis",
    task_acks_late=True,
    task_soft_time_limit=300,
    task_time_limit=360,
    result_expires=3600,
    include=["tasks.generate_report"],
)
