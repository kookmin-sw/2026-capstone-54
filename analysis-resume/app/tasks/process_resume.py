"""
이력서 처리 파이프라인 오케스트레이션 task.

파이프라인 구조:
  [file 타입]
    extract_text_task          → PDF에서 텍스트 추출 (S3 or 로컬)
    parallel_pipeline_task     → 아래 두 task를 chord로 병렬 실행
      ├─ embed_resume_task     → 청킹 + 임베딩 저장
      └─ analyze_resume_task   → 청킹 + LLM 병렬 분석
    finalize_resume_task       → 분석 임베딩 저장 + status completed

  [text 타입]
    parallel_pipeline_task (바로 시작)
      ├─ embed_resume_task
      └─ analyze_resume_task
    finalize_resume_task
"""

from celery import chain, chord, group
from celery.result import AsyncResult

from app import db
from app.celery_app import app
from app.tasks.analyze_resume import analyze_resume_task
from app.tasks.embed_resume import embed_resume_task
from app.tasks.extract_text import extract_text_task
from app.tasks.finalize_resume import finalize_resume_task
from app.utils.logger import get_logger

logger = get_logger(__name__)


@app.task(bind=True, name="store_resume.tasks.parallel_pipeline", max_retries=1)
def parallel_pipeline_task(self, payload: dict) -> None:
  resume_uuid = payload["resume_uuid"]
  logger.info("병렬 파이프라인 시작", resume_uuid=resume_uuid)
  chord(
    group(embed_resume_task.s(payload), analyze_resume_task.s(payload)),
    finalize_resume_task.s(),
  ).apply_async()


@app.task(bind=True, name="store_resume.tasks.process_resume", max_retries=1, default_retry_delay=10)
def process_resume_task(
  self,
  resume_uuid: str,
  user_id: int,
  type: str,
  text: str | None = None,
  storage_path: str | None = None,
) -> str:
  """이력서 처리 파이프라인 진입점."""
  logger.info("이력서 처리 시작", resume_uuid=resume_uuid, type=type)

  try:
    db.update_resume_status(resume_uuid=resume_uuid, status="processing", step="extracting_text")

    if type == "file":
      if not storage_path:
        raise ValueError("file 타입에는 storage_path가 필요합니다.")
      pipeline = chain(
        extract_text_task.s(resume_uuid, user_id, storage_path),
        parallel_pipeline_task.s(),
      )
    else:
      if not text:
        raise ValueError("text 타입에는 text가 필요합니다.")
      db.update_resume_step(resume_uuid=resume_uuid, step="embedding")
      payload = {"resume_uuid": resume_uuid, "user_id": user_id, "text": text}
      pipeline = parallel_pipeline_task.s(payload)

    result: AsyncResult | None = pipeline.apply_async()
    task_id: str = str(result.id) if result is not None else "unknown"
    logger.info("파이프라인 시작 완료", resume_uuid=resume_uuid, task_id=task_id)
    return task_id

  except Exception as exc:
    logger.error("파이프라인 시작 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    db.update_resume_status(resume_uuid=resume_uuid, status="failed")
    raise self.retry(exc=exc)
