"""이력서 텍스트 chunking + 임베딩 task.

DB 쓰기는 하지 않으며, 생성된 임베딩을 chord 하위 task 결과로 반환한다.
backend 의 apply_analysis_result 태스크가 최종적으로 bulk_create 해서 저장한다.
"""

from app import config
from app.celery_app import app
from app.common import chunk_text, embed_texts
from app.utils.logger import get_logger

logger = get_logger(__name__)


@app.task(bind=True, name="analysis_resume.tasks.embed_resume", max_retries=2, default_retry_delay=60)
def embed_resume_task(self, payload: dict) -> dict:
  """이력서 텍스트를 청킹·임베딩하고 벡터 목록을 payload 로 반환한다."""
  resume_uuid: str = payload["resume_uuid"]
  user_id: int = payload["user_id"]
  text: str = payload["text"]

  logger.info("임베딩 시작", resume_uuid=resume_uuid, text_len=len(text))

  app.send_task(
    "resumes.tasks.update_resume_step",
    queue="celery",
    kwargs={"resume_uuid": resume_uuid, "step": "embedding"},
  )

  try:
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

    embedding_records = [
      {
        "context": chunk,
        "vector": embedding,
        "chunk_type": "text",
        "chunk_index": idx,
      }
      for idx, (chunk, embedding) in enumerate(zip(chunks, all_embeddings))
    ]

    logger.info("임베딩 완료", resume_uuid=resume_uuid, chunk_count=len(chunks))

    return {
      "type": "embed",
      "resume_uuid": resume_uuid,
      "user_id": user_id,
      "embeddings": embedding_records,
      "token_usage": {
        "operation_type": "embed",
        "model_name": config.OPENAI_EMBEDDING_MODEL,
        "prompt_tokens": total_embed_tokens,
        "total_tokens": total_embed_tokens,
      },
    }

  except Exception as exc:
    logger.error("임베딩 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    app.send_task(
      "resumes.tasks.mark_resume_failed",
      queue="celery",
      kwargs={"resume_uuid": resume_uuid, "error": str(exc)},
    )
    raise self.retry(exc=exc)
