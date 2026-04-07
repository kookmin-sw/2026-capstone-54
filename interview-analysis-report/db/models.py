"""
SQLAlchemy 테이블 매핑.

Django가 관리하는 테이블 스키마를 SQLAlchemy로 매핑한다.
- InterviewSessionTable, InterviewExchangeTable: 읽기 전용
- AnalysisReportTable: 읽기/쓰기 (updated_at 명시적 설정 필요)
"""

from sqlalchemy import Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class InterviewSessionTable(Base):
    """interview_sessions 테이블 읽기 전용 매핑."""

    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True)
    status = Column(String(15))
    started_at = Column(DateTime)
    duration_seconds = Column(Integer)
    difficulty_level = Column(String(10))
    resume_file = Column(String(255))
    job_posting_file = Column(String(255))
    total_initial_questions = Column(Integer)
    total_followup_questions = Column(Integer)
    avg_answer_length = Column(Integer)


class InterviewExchangeTable(Base):
    """interview_exchanges 테이블 읽기 전용 매핑."""

    __tablename__ = "interview_exchanges"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, nullable=False)
    exchange_type = Column(String(10))
    depth = Column(Integer)
    question = Column(Text)
    answer = Column(Text)
    question_source = Column(String(20), default="")
    question_purpose = Column(String(500), default="")


class AnalysisReportTable(Base):
    """analysis_reports 테이블 읽기/쓰기 매핑."""

    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, server_default="now()")
    updated_at = Column(DateTime, server_default="now()")
    session_id = Column(Integer, nullable=False, unique=True)
    status = Column(String(15), default="generating")
    error_message = Column(Text, default="")
    overall_score = Column(Integer, nullable=True)
    overall_grade = Column(String(20), default="")
    overall_comment = Column(Text, default="")
    category_scores = Column(JSONB, default=list)
    question_feedbacks = Column(JSONB, default=list)
    strengths = Column(JSONB, default=list)
    improvement_areas = Column(JSONB, default=list)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    total_cost_usd = Column(Numeric(10, 6), default=0)
