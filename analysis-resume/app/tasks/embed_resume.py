"""이력서 텍스트 chunking + 임베딩 + pgvector 저장 task."""

from app import config, db
from app.celery_app import app
from app.common import chunk_text, embed_texts
from app.utils.logger import get_logger

logger = get_logger(__name__)


@app.task(bind=True, name="store_resume.tasks.embed_resume", max_retries=2, default_retry_delay=60)
def embed_resume_task(self, payload: dict) -> dict:
  """이력서 텍스트를 청킹·임베딩하여 resume_embeddings 테이블에 저장합니다."""
  resume_uuid: str = payload["resume_uuid"]
  user_id: int = payload["user_id"]
  text: str = payload["text"]

  logger.info("임베딩 시작", resume_uuid=resume_uuid, text_len=len(text))

  try:
    db.update_resume_step(resume_uuid=resume_uuid, step="embedding")
    chunks = chunk_text(text)
    if not chunks:
      raise ValueError("유효한 청크가 없습니다.")

    all_embeddings: list[list[float]] = []
    total_embed_tokens = 0
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
      batch = chunks[i : i + batch_size]
      batch_embeddings, batch_tokens = embed_texts(batch)
      all_embeddings.extend(batch_embeddings)
      total_embed_tokens += batch_tokens

    chunk_records = [
      {"context": chunk, "embedding": embedding, "chunk_type": "text", "chunk_index": idx}
      for idx, (chunk, embedding) in enumerate(zip(chunks, all_embeddings))
    ]

    db.upsert_embeddings(resume_uuid=resume_uuid, user_id=user_id, chunks=chunk_records)
    db.record_token_usage(
      user_id=user_id,
      resume_uuid=resume_uuid,
      operation_type="embed",
      model_name=config.OPENAI_EMBEDDING_MODEL,
      prompt_tokens=total_embed_tokens,
      total_tokens=total_embed_tokens,
    )
    logger.info("임베딩 저장 완료", resume_uuid=resume_uuid, chunk_count=len(chunks))

    return {
      "type": "embed",
      "resume_uuid": resume_uuid,
      "chunk_count": len(chunks),
      "prompt_tokens": total_embed_tokens,
      "total_tokens": total_embed_tokens,
    }

  except Exception as exc:
    logger.error("임베딩 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    db.update_resume_status(resume_uuid=resume_uuid, status="failed")
    raise self.retry(exc=exc)
