"""
resume_file_contents 테이블 SQLAlchemy 매핑.

이력서 파일에서 추출된 텍스트를 저장한다.
"""

from sqlalchemy import BigInteger, Column, String, Text

from app.schemas.base import Base


class ResumeFileContentTable(Base):
    """resume_file_contents 테이블 매핑."""

    __tablename__ = "resume_file_contents"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    resume_id = Column(String, nullable=False)
    content = Column(Text, default="")
