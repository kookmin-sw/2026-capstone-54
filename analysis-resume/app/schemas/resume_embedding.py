"""
resume_embeddings 테이블 SQLAlchemy 매핑.

pgvector.sqlalchemy.Vector 타입으로 임베딩 벡터를 저장한다.
"""

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.schemas.base import Base


class ResumeEmbeddingTable(Base):
    """resume_embeddings 테이블 매핑."""

    __tablename__ = "resume_embeddings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    uuid = Column(String, server_default=func.gen_random_uuid())
    resume_id = Column(String, nullable=False)
    user_id = Column(Integer, nullable=False)
    embedding_vector = Column(Vector(1536), nullable=False)
    context = Column(Text, default="")
    chunk_type = Column(String(50), default="text")
    chunk_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
