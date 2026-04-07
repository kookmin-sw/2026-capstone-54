"""
채용공고 핵심 데이터 모델.

pipeline, scraper, extractor 모든 모듈이 공통으로 참조하는 기반 스키마입니다.
기존 extractors/schema.py 의 JobPosting dataclass를 Pydantic 모델로 재정의합니다.
"""

from datetime import datetime, timezone
from pydantic import BaseModel, Field


class JobPostingSchema(BaseModel):
    """채용공고 표준 데이터 모델."""

    # 메타 정보
    url: str = Field(description="채용공고 원본 URL")
    platform: str = Field(default="", description="플랫폼명 (saramin, jobkorea, jobplanet 등)")

    # 기본 정보
    company: str = Field(default="", description="회사명")
    title: str = Field(default="", description="채용공고 제목")

    # 공고 본문
    duties: str = Field(default="", description="담당업무")
    requirements: str = Field(default="", description="지원자격 / 필수조건")
    preferred: str = Field(default="", description="우대사항")

    # 근무 조건
    work_type: str = Field(default="", description="고용형태 (정규직, 계약직, 인턴 등)")
    salary: str = Field(default="", description="급여 정보")
    location: str = Field(default="", description="근무지역")
    education: str = Field(default="", description="학력 조건")
    experience: str = Field(default="", description="경력 조건")

    # 수집 시각
    scraped_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="수집 시각 (ISO 8601, UTC)",
    )