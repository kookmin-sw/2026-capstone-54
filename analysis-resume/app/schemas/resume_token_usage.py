"""
resume_token_usages 테이블 SQLAlchemy 매핑.

OpenAI API 호출 시 소모된 토큰 사용량을 기록한다.
"""

from sqlalchemy import BigInteger, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.schemas.base import Base


class ResumeTokenUsageTable(Base):
    """resume_token_usages 테이블 매핑."""

    __tablename__ = "resume_token_usages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    resume_id = Column(String, nullable=True)
    operation_type = Column(String(50), nullable=False)
    model_name = Column(String(100), nullable=False)
    prompt_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
