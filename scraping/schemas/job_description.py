"""
job_descriptions 테이블 SQLAlchemy 매핑.

Django(backend/)가 관리하는 테이블을 매핑한다.
마이그레이션과 테이블 생성은 backend/ Django에서 담당하며,
이 파일은 scraping 결과를 저장하는 용도로만 사용한다.
"""

from sqlalchemy import BigInteger, Column, DateTime, String, Text
from sqlalchemy.sql import func

from schemas.base import Base


class JobDescriptionTable(Base):
    """job_descriptions 테이블 매핑."""

    __tablename__ = "job_descriptions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 메타 정보
    url = Column(String(2048), nullable=False, unique=True)
    platform = Column(String(50), default="")

    # 기본 정보
    company = Column(String(255), default="")
    title = Column(String(255), default="")

    # 공고 본문
    duties = Column(Text, default="")
    requirements = Column(Text, default="")
    preferred = Column(Text, default="")

    # 근무 조건
    work_type = Column(String(50), default="")
    salary = Column(String(255), default="")
    location = Column(String(255), default="")
    education = Column(String(100), default="")
    experience = Column(String(100), default="")

    # 수집 상태
    collection_status = Column(String(20), default="pending")
    scraped_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, default="")
