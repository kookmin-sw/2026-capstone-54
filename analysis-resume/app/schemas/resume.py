"""
resumes 테이블 SQLAlchemy 매핑.

Django(backend/)가 관리하는 테이블을 매핑한다.
analysis_status, analysis_step, parsed_data 등 분석 관련 필드만 업데이트한다.
"""

from sqlalchemy import Boolean, Column, DateTime, String, Text

from app.schemas.base import Base


class ResumeTable(Base):
    """resumes 테이블 매핑 (업데이트 전용)."""

    __tablename__ = "resumes"

    uuid = Column(String, primary_key=True)
    analysis_status = Column(String(20))
    analysis_step = Column(String(50), nullable=True)
    is_parsed = Column(Boolean, default=False)
    parsed_data = Column(Text, nullable=True)
    analyzed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True))
