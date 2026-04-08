"""
SQLAlchemy를 통한 backend/ DB 연결 헬퍼.

마이그레이션과 테이블 생성은 backend/ Django에서 담당하며,
이 모듈은 resumes, resume_embeddings, resume_token_usages, resume_file_contents
테이블에 데이터를 읽고 쓰는 용도로만 사용합니다.

Resume PK는 UUID 문자열입니다.
"""

import json
import logging
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import create_engine, delete, insert, update
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func

from app.config import DATABASE_URL
from app.schemas import (
    ResumeEmbeddingTable,
    ResumeFileContentTable,
    ResumeTable,
    ResumeTokenUsageTable,
)

logger = logging.getLogger(__name__)

# ── SQLAlchemy 엔진 및 세션 팩토리 ──────────────────────
engine = create_engine(
    DATABASE_URL,
    # AWS RDS 환경에서 장시간 idle 후 끊긴 커넥션을 재사용하지 않도록 방지
    pool_pre_ping=True,
    # RDS의 기본 idle connection timeout(보통 8분)보다 짧게 주기적 갱신
    pool_recycle=300,
)
SessionLocal = sessionmaker(bind=engine)


@contextmanager
def get_session():
    """SQLAlchemy 세션 컨텍스트 매니저. commit/rollback을 자동 처리한다."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ── 헬퍼 함수 ──────────────────────────────────────────

def upsert_embeddings(
    resume_uuid: str,
    user_id: int,
    chunks: list[dict[str, Any]],
) -> None:
    """
    resume_embeddings 테이블에 청크 임베딩을 삽입합니다.
    기존 데이터는 resume_uuid 기준으로 먼저 삭제 후 재삽입합니다.
    """
    with get_session() as session:
        session.execute(
            delete(ResumeEmbeddingTable).where(
                ResumeEmbeddingTable.resume_id == resume_uuid
            )
        )
        now = datetime.now(timezone.utc)
        session.execute(
            insert(ResumeEmbeddingTable),
            [
                {
                    "uuid": str(uuid.uuid4()),
                    "resume_id": resume_uuid,
                    "user_id": user_id,
                    "embedding_vector": chunk["embedding"],
                    "context": chunk["context"],
                    "chunk_type": chunk.get("chunk_type", "text"),
                    "chunk_index": chunk.get("chunk_index", idx),
                    "created_at": now,
                    "updated_at": now,
                }
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
    values: dict[str, Any] = {
        "analysis_status": status,
        "updated_at": func.now(),
    }

    if step is not None:
        values["analysis_step"] = step

    if analyzed_at_now:
        values["analyzed_at"] = func.now()
        values["is_parsed"] = True
    elif status == "failed":
        values["analyzed_at"] = None

    if parsed_data is not None:
        values["parsed_data"] = json.dumps(parsed_data)

    with get_session() as session:
        session.execute(
            update(ResumeTable)
            .where(ResumeTable.uuid == resume_uuid)
            .values(**values)
        )
    logger.info("Resume 상태 업데이트 | resume_uuid=%s, status=%s, step=%s", resume_uuid, status, step)


def update_resume_step(resume_uuid: str, step: str) -> None:
    """analysis_step만 갱신합니다."""
    with get_session() as session:
        session.execute(
            update(ResumeTable)
            .where(ResumeTable.uuid == resume_uuid)
            .values(analysis_step=step, updated_at=func.now())
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
    now = datetime.now(timezone.utc)
    with get_session() as session:
        session.execute(
            insert(ResumeTokenUsageTable).values(
                user_id=user_id,
                resume_id=resume_uuid,
                operation_type=operation_type,
                model_name=model_name,
                prompt_tokens=prompt_tokens,
                total_tokens=total_tokens,
                created_at=now,
                updated_at=now,
            )
        )
    logger.info(
        "토큰 사용량 기록 | op=%s, model=%s, prompt=%d, total=%d",
        operation_type, model_name, prompt_tokens, total_tokens,
    )


def update_file_content_text(resume_uuid: str, extracted_text: str) -> None:
    """resume_file_contents.content 컬럼에 추출된 텍스트를 저장합니다."""
    with get_session() as session:
        session.execute(
            update(ResumeFileContentTable)
            .where(ResumeFileContentTable.resume_id == resume_uuid)
            .values(content=extracted_text)
        )
    logger.info("파일 텍스트 저장 완료 | resume_uuid=%s, len=%d", resume_uuid, len(extracted_text))


def insert_embeddings(
    resume_uuid: str,
    user_id: int,
    chunks: list[tuple[str, list[float], str]],
) -> None:
    """
    resume_embeddings 테이블에 추가 임베딩 청크를 삽입합니다.
    (finalize_resume_task에서 분석 결과 임베딩 삽입 시 사용)
    """
    now = datetime.now(timezone.utc)
    with get_session() as session:
        session.execute(
            insert(ResumeEmbeddingTable),
            [
                {
                    "uuid": str(uuid.uuid4()),
                    "resume_id": resume_uuid,
                    "user_id": user_id,
                    "embedding_vector": emb,
                    "context": ctx,
                    "chunk_type": ctype,
                    "chunk_index": 0,
                    "created_at": now,
                    "updated_at": now,
                }
                for ctx, emb, ctype in chunks
            ],
        )
    logger.info("추가 임베딩 삽입 완료 | resume_uuid=%s, chunks=%d", resume_uuid, len(chunks))
