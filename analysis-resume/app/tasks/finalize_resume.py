"""이력서 처리 최종 완료 task."""

from app import config, db
from app.celery_app import app
from app.common import embed_texts
from app.utils.logger import get_logger

logger = get_logger(__name__)


@app.task(bind=True, name="store_resume.tasks.finalize_resume", max_retries=1, default_retry_delay=10)
def finalize_resume_task(self, group_results: list[dict]) -> dict:
  """embed_resume_task와 analyze_resume_task의 결과를 받아 최종 처리합니다."""
  results_by_type = {r["type"]: r for r in group_results if isinstance(r, dict)}
  analyze_result = results_by_type.get("analyze", {})

  resume_uuid: str = analyze_result.get("resume_uuid") or group_results[0].get("resume_uuid")
  user_id: int = analyze_result.get("user_id") or group_results[0].get("user_id")
  parsed_data: dict = analyze_result.get("parsed_data", {})

  logger.info("최종 처리 시작", resume_uuid=resume_uuid)

  try:
    db.update_resume_step(resume_uuid=resume_uuid, step="finalizing")
    extra_chunks: list[tuple[str, list[float], str]] = []
    analysis_embed_tokens = 0

    if career_summary := parsed_data.get("career_summary", "").strip():
      ([embedding], tokens) = embed_texts([career_summary])
      extra_chunks.append((career_summary, embedding, "career"))
      analysis_embed_tokens += tokens

    if skills := parsed_data.get("skills", []):
      skills_text = "기술 스택: " + ", ".join(skills)
      ([embedding], tokens) = embed_texts([skills_text])
      extra_chunks.append((skills_text, embedding, "skill"))
      analysis_embed_tokens += tokens

    if keywords := parsed_data.get("keywords", []):
      keywords_text = "핵심 키워드: " + ", ".join(keywords)
      ([embedding], tokens) = embed_texts([keywords_text])
      extra_chunks.append((keywords_text, embedding, "keyword"))
      analysis_embed_tokens += tokens

    if extra_chunks:
      db.insert_embeddings(resume_uuid=resume_uuid, user_id=user_id, chunks=extra_chunks)

    if analysis_embed_tokens > 0:
      db.record_token_usage(
        user_id=user_id,
        resume_uuid=resume_uuid,
        operation_type="embed",
        model_name=config.OPENAI_EMBEDDING_MODEL,
        prompt_tokens=analysis_embed_tokens,
        total_tokens=analysis_embed_tokens,
      )

    db.update_resume_status(
      resume_uuid=resume_uuid,
      status="completed",
      step="done",
      analyzed_at_now=True,
      parsed_data=parsed_data,
    )

    logger.info("이력서 처리 완료", resume_uuid=resume_uuid)
    return {"resume_uuid": resume_uuid, "status": "completed"}

  except Exception as exc:
    logger.error("최종 처리 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    db.update_resume_status(resume_uuid=resume_uuid, status="failed")
    raise self.retry(exc=exc)
