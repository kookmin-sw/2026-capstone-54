"""
SQLAlchemy 테이블 매핑.

Django가 관리하는 테이블 스키마를 SQLAlchemy로 매핑한다.
- InterviewSessionTable, InterviewTurnTable: 읽기 전용
- AnalysisReportTable: 읽기/쓰기 (updated_at 명시적 설정 필요)
- TokenUsageTable: 쓰기 전용
- 콘텐츠 조회용 테이블(Resume, JobDescription 계열): 읽기 전용
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class InterviewSessionTable(Base):
    """interview_sessions 테이블 읽기 전용 매핑."""

    __tablename__ = "interview_sessions"

    uuid = Column(UUID(as_uuid=False), primary_key=True)
    interview_session_status = Column(String(20))
    interview_session_type = Column(String(20))
    interview_difficulty_level = Column(String(20))
    resume_id = Column(UUID(as_uuid=False))
    user_job_description_id = Column(UUID(as_uuid=False))
    total_questions = Column(Integer)
    total_followup_questions = Column(Integer)


class InterviewTurnTable(Base):
    """interview_turns 테이블 읽기 전용 매핑."""

    __tablename__ = "interview_turns"

    id = Column(Integer, primary_key=True)
    interview_session_id = Column(UUID(as_uuid=False), nullable=False)
    turn_type = Column(String(10))
    turn_number = Column(Integer)
    question = Column(Text)
    answer = Column(Text)
    question_source = Column(String(20), default="")


class AnalysisReportTable(Base):
    """interview_analysis_reports 테이블 읽기/쓰기 매핑."""

    __tablename__ = "interview_analysis_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, server_default="now()")
    updated_at = Column(DateTime, server_default="now()")
    interview_session_id = Column(UUID(as_uuid=False), nullable=False, unique=True)
    interview_analysis_report_status = Column(String(15), default="pending")
    error_message = Column(Text, default="")
    overall_score = Column(Integer, nullable=True)
    overall_grade = Column(String(20), default="")
    overall_comment = Column(Text, default="")
    category_scores = Column(JSONB, default=list)
    question_feedbacks = Column(JSONB, default=list)
    strengths = Column(JSONB, default=list)
    improvement_areas = Column(JSONB, default=list)


class TokenUsageTable(Base):
    """common_token_usages 테이블 쓰기 매핑.

    Django GenericForeignKey 기반 토큰 사용량 기록.
    token_usable_type_id 는 django_content_type.id 를 참조한다.
    """

    __tablename__ = "common_token_usages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    token_usable_type_id = Column(Integer, nullable=False)
    token_usable_id = Column(String(40), nullable=False)
    operation = Column(String(20), nullable=False)
    context = Column(String(30), default="other")
    model_name = Column(String(100), nullable=False)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    cost_usd = Column(Numeric(10, 6), default=0)


class DjangoContentTypeTable(Base):
    """django_content_type 테이블 읽기 전용 매핑.

    TokenUsage 저장 시 GenericForeignKey의 content_type_id 조회에 사용한다.
    """

    __tablename__ = "django_content_type"

    id = Column(Integer, primary_key=True)
    app_label = Column(String(100))
    model = Column(String(100))


class ResumeTable(Base):
    """resumes 테이블 읽기 전용 매핑."""

    __tablename__ = "resumes"

    uuid = Column(UUID(as_uuid=False), primary_key=True)
    type = Column(String(20))
    deleted_at = Column(DateTime, nullable=True)


class ResumeFileContentTable(Base):
    """resume_file_contents 테이블 읽기 전용 매핑."""

    __tablename__ = "resume_file_contents"

    id = Column(Integer, primary_key=True)
    resume_id = Column(UUID(as_uuid=False), nullable=False)
    content = Column(Text)
    deleted_at = Column(DateTime, nullable=True)


class ResumeTextContentTable(Base):
    """resume_text_contents 테이블 읽기 전용 매핑."""

    __tablename__ = "resume_text_contents"

    id = Column(Integer, primary_key=True)
    resume_id = Column(UUID(as_uuid=False), nullable=False)
    content = Column(Text)
    deleted_at = Column(DateTime, nullable=True)


class UserJobDescriptionTable(Base):
    """user_job_descriptions 테이블 읽기 전용 매핑."""

    __tablename__ = "user_job_descriptions"

    uuid = Column(UUID(as_uuid=False), primary_key=True)
    job_description_id = Column(Integer, nullable=False)


class JobDescriptionTable(Base):
    """job_descriptions 테이블 읽기 전용 매핑."""

    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True)
    company = Column(String(255), default="")
    title = Column(String(255), default="")
    platform = Column(String(50), default="")
    duties = Column(Text, default="")
    requirements = Column(Text, default="")
    preferred = Column(Text, default="")
    work_type = Column(String(50), default="")
    salary = Column(String(255), default="")
    location = Column(String(255), default="")
    education = Column(String(100), default="")
    experience = Column(String(100), default="")
