"""이력서 처리 파이프라인 오케스트레이션 task.

파이프라인 구조:
  [file 타입]
    extract_text_task          → PDF 에서 텍스트 추출 (S3)
    parallel_pipeline_task     → 아래 두 task 를 chord 로 병렬 실행
      ├─ embed_resume_task     → 청킹 + 임베딩 (DB 쓰기 없음, payload 반환)
      └─ analyze_resume_task   → 청킹 + LLM 병렬 분석 (DB 쓰기 없음, payload 반환)
    finalize_resume_task       → 결과를 모아 backend apply_analysis_result 태스크로 전달

  [text 타입]
    parallel_pipeline_task (바로 시작)
      ├─ embed_resume_task
      └─ analyze_resume_task
    finalize_resume_task
"""

from celery import chain, chord, group
from celery.result import AsyncResult

from app.celery_app import app
from app.tasks.analyze_resume import analyze_resume_task
from app.tasks.embed_resume import embed_resume_task
from app.tasks.extract_text import extract_text_task
from app.tasks.finalize_resume import finalize_resume_task
from app.utils.logger import get_logger

logger = get_logger(__name__)


@app.task(bind=True, name="analysis_resume.tasks.parallel_pipeline", max_retries=1)
def parallel_pipeline_task(self, payload: dict) -> None:
  """embed + analyze 를 chord 로 묶고, 결과를 finalize 에게 넘긴다."""
  resume_uuid = payload["resume_uuid"]
  user_id = payload["user_id"]
  file_text_content = payload.get("file_text_content")
  logger.info("병렬 파이프라인 시작", resume_uuid=resume_uuid)

  chord(
    group(
      embed_resume_task.s(payload),
      analyze_resume_task.s(payload),
    ),
    finalize_resume_task.s(
      resume_uuid=resume_uuid,
      user_id=user_id,
      file_text_content=file_text_content,
    ),
  ).apply_async()


@app.task(bind=True, name="analysis_resume.tasks.process_resume", max_retries=1, default_retry_delay=10)
def process_resume_task(
  self,
  resume_uuid: str,
  user_id: int,
  type: str,
  text: str | None = None,
  storage_path: str | None = None,
) -> str:
  """이력서 처리 파이프라인 진입점. backend 에서 send_task 로 호출된다."""
  logger.info("이력서 처리 시작", resume_uuid=resume_uuid, type=type)

  # 초기 진행 단계를 backend 에 알림 (pending → processing/extracting_text)
  app.send_task(
    "resumes.tasks.update_resume_step",
    queue="celery",
    kwargs={"resume_uuid": resume_uuid, "step": "extracting_text"},
  )

  try:
    if type == "file":
      if not storage_path:
        raise ValueError("file 타입에는 storage_path 가 필요합니다.")
      pipeline = chain(
        extract_text_task.s(resume_uuid, user_id, storage_path),
        parallel_pipeline_task.s(),
      )
    else:
      if not text:
        raise ValueError("text 타입에는 text 가 필요합니다.")
      payload = {
        "resume_uuid": resume_uuid,
        "user_id": user_id,
        "text": text,
        # text 타입은 별도의 추출 텍스트가 없으므로 backend 파일 콘텐츠 저장은 생략
        "file_text_content": None,
      }
      pipeline = parallel_pipeline_task.s(payload)

    result: AsyncResult | None = pipeline.apply_async()
    task_id: str = str(result.id) if result is not None else "unknown"
    logger.info("파이프라인 시작 완료", resume_uuid=resume_uuid, task_id=task_id)
    return task_id

  except Exception as exc:
    logger.error("파이프라인 시작 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    app.send_task(
      "resumes.tasks.mark_resume_failed",
      queue="celery",
      kwargs={"resume_uuid": resume_uuid, "error": str(exc)},
    )
    raise self.retry(exc=exc)
