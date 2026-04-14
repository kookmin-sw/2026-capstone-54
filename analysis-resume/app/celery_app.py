"""
Celery 앱 설정 — analysis-resume worker.

이력서 처리 파이프라인(텍스트 추출 → 임베딩 → LLM 분석)을
비동기 태스크로 실행합니다.

실행 예시:
    celery -A app.celery_app worker -Q analysis-resume -l INFO --concurrency 2
"""

from app import config
from celery import Celery

app = Celery("analysis_resume")
app.conf.update(
  broker_url=config.CELERY_BROKER_URL,
  result_backend=config.CELERY_RESULT_BACKEND,
  task_serializer="json",
  result_serializer="json",
  accept_content=["json"],
  task_default_queue="analysis-resume",
  worker_prefetch_multiplier=1,
  task_acks_late=True,
  task_soft_time_limit=300,
  task_time_limit=360,
  result_expires=3600,
  # Flower 대시보드에서 analysis-resume 태스크를 표시하려면 이벤트 발행이 켜져 있어야 한다.
  # - worker_send_task_events: worker 가 task-received/started/succeeded/failed 이벤트를 발행
  # - task_send_sent_event: 태스크 발행 시점에 task-sent 이벤트 발행 → Flower 에 "SENT" 표시
  # CLI `-E` 와 별개로 config 에 명시해 컨테이너 재기동·환경 변화에 영향받지 않게 한다.
  worker_send_task_events=True,
  task_send_sent_event=True,
  include=[
    "app.tasks.extract_text",
    "app.tasks.embed_resume",
    "app.tasks.analyze_resume",
    "app.tasks.finalize_resume",
    "app.tasks.process_resume",
    "app.tasks.reembed_resume",
  ],
)
