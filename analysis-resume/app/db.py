"""
psycopg를 통한 backend/ DB 직접 연결 헬퍼.

마이그레이션과 테이블 생성은 backend/ Django에서 담당하며,
이 모듈은 resume_embeddings 테이블에 데이터를 읽고 쓰는 용도로만 사용합니다.

Resume PK는 UUID 문자열입니다.
"""

import contextlib
import json
import logging
from typing import Any, Generator

import psycopg
from psycopg import sql as psql
from pgvector.psycopg import register_vector

from app import config

logger = logging.getLogger(__name__)

_DSN = (
  f"host={config.DB_HOST} "
  f"port={config.DB_PORT} "
  f"dbname={config.DB_NAME} "
  f"user={config.DB_USER} "
  f"password={config.DB_PASSWORD}"
)


@contextlib.contextmanager
def get_connection() -> Generator[psycopg.Connection, None, None]:
  """psycopg 커넥션 컨텍스트 매니저. 사용 후 자동 close."""
  conn = psycopg.connect(_DSN)
  try:
    register_vector(conn)
    yield conn
    conn.commit()
  except Exception:
    conn.rollback()
    raise
  finally:
    conn.close()


def upsert_embeddings(
  resume_uuid: str,
  user_id: int,
  chunks: list[dict[str, Any]],
) -> None:
  """
  resume_embeddings 테이블에 청크 임베딩을 삽입합니다.
  기존 데이터는 resume_uuid 기준으로 먼저 삭제 후 재삽입합니다.
  """
  with get_connection() as conn:
    with conn.cursor() as cur:
      cur.execute(
        "DELETE FROM resume_embeddings WHERE resume_id = %s",
        (resume_uuid,),
      )
      cur.executemany(
        """
        INSERT INTO resume_embeddings
          (uuid, resume_id, user_id, embedding_vector, context, chunk_type, chunk_index, created_at, updated_at)
        VALUES
          (gen_random_uuid(), %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """,
        [
          (
            resume_uuid,
            user_id,
            chunk["embedding"],
            chunk["context"],
            chunk.get("chunk_type", "text"),
            chunk.get("chunk_index", idx),
          )
          for idx, chunk in enumerate(chunks)
        ],
      )
  logger.info("임베딩 저장 완료 | resume_uuid=%s, chunks=%d", resume_uuid, len(chunks))


def update_resume_status(
  resume_uuid: str,
  status: str,
  step: str | None = None,
  analyzed_at_now: bool = False,
  parsed_data: dict | None = None,
) -> None:
  """resumes 테이블의 analysis_status, analysis_step 및 관련 필드를 업데이트합니다."""
  set_fragments: list[psql.Composable] = [
    psql.SQL("analysis_status = %s"),
    psql.SQL("updated_at = NOW()"),
  ]
  params: list[Any] = [status]

  if step is not None:
    set_fragments.append(psql.SQL("analysis_step = %s"))
    params.append(step)

  if analyzed_at_now:
    set_fragments.append(psql.SQL("analyzed_at = NOW()"))
    set_fragments.append(psql.SQL("is_parsed = TRUE"))
  elif status == "failed":
    set_fragments.append(psql.SQL("analyzed_at = NULL"))

  if parsed_data is not None:
    set_fragments.append(psql.SQL("parsed_data = %s"))
    params.append(json.dumps(parsed_data))

  params.append(resume_uuid)

  query = psql.SQL("UPDATE resumes SET {fields} WHERE uuid = %s").format(
    fields=psql.SQL(", ").join(set_fragments),
  )

  with get_connection() as conn:
    with conn.cursor() as cur:
      cur.execute(query, params)
  logger.info("Resume 상태 업데이트 | resume_uuid=%s, status=%s, step=%s", resume_uuid, status, step)


def update_resume_step(resume_uuid: str, step: str) -> None:
  """analysis_step만 갱신합니다."""
  with get_connection() as conn:
    with conn.cursor() as cur:
      cur.execute(
        "UPDATE resumes SET analysis_step = %s, updated_at = NOW() WHERE uuid = %s",
        (step, resume_uuid),
      )
  logger.info("Resume 단계 업데이트 | resume_uuid=%s, step=%s", resume_uuid, step)


def record_token_usage(
  user_id: int,
  operation_type: str,
  model_name: str,
  prompt_tokens: int,
  total_tokens: int,
  resume_uuid: str | None = None,
) -> None:
  """resume_token_usages 테이블에 API 토큰 사용량을 기록합니다."""
  with get_connection() as conn:
    with conn.cursor() as cur:
      cur.execute(
        """
        INSERT INTO resume_token_usages
          (user_id, resume_id, operation_type, model_name,
           prompt_tokens, total_tokens, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
        """,
        (user_id, resume_uuid, operation_type, model_name, prompt_tokens, total_tokens),
      )
  logger.info(
    "토큰 사용량 기록 | op=%s, model=%s, prompt=%d, total=%d",
    operation_type, model_name, prompt_tokens, total_tokens,
  )


def update_file_content_text(resume_uuid: str, extracted_text: str) -> None:
  """resume_file_contents.content 컬럼에 추출된 텍스트를 저장합니다."""
  with get_connection() as conn:
    with conn.cursor() as cur:
      cur.execute(
        "UPDATE resume_file_contents SET content = %s WHERE resume_id = %s",
        (extracted_text, resume_uuid),
      )
  logger.info("파일 텍스트 저장 완료 | resume_uuid=%s, len=%d", resume_uuid, len(extracted_text))
