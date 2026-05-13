"""이력서 분석 결과 Pydantic 스키마 (analysis-resume 버전).

LLM 구조화 출력(with_structured_output) 계약으로 사용된다.

SYNC: /Users/koa/005-capstone/backend/webapp/resumes/schemas/parsed_data.py 와 1:1 동기화한다.
변경 시 양쪽을 함께 수정한다.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class BasicInfo(BaseModel):
  """이력서 소유자 기본 인적사항."""

  name: str | None = Field(default=None, description="이름")
  email: str | None = Field(default=None, description="이메일 주소")
  phone: str | None = Field(default=None, description="연락처")
  location: str | None = Field(default=None, description="거주지 또는 근무 희망지")


class SkillGroup(BaseModel):
  """스킬을 4개 하위 그룹으로 분류한 구조."""

  technical: list[str] = Field(
    default_factory=list,
    description="프로그래밍 언어, 프레임워크, 라이브러리, 하드 스킬 등",
  )
  soft: list[str] = Field(
    default_factory=list,
    description="커뮤니케이션, 리더십, 협업 등 소프트 스킬",
  )
  tools: list[str] = Field(
    default_factory=list,
    description="SaaS, 개발/디자인/분석 도구, 플랫폼",
  )
  languages: list[str] = Field(
    default_factory=list,
    description="외국어 구사 능력 (예: 영어, 일본어) — 단순 목록",
  )


class Experience(BaseModel):
  """경력 한 건."""

  company: str = Field(default="", description="회사명")
  role: str = Field(default="", description="직함/직무")
  period: str = Field(default="", description="근무 기간 (예: 2020.03 - 2023.06)")
  responsibilities: list[str] = Field(
    default_factory=list,
    description="담당했던 주요 업무/책임 bullet 목록",
  )
  highlights: list[str] = Field(
    default_factory=list,
    description="수치/지표가 포함된 주요 성과 bullet 목록",
  )


class Education(BaseModel):
  """학력 한 건."""

  school: str = Field(default="", description="학교명")
  degree: str = Field(default="", description="학위 (학사/석사/박사 등)")
  major: str = Field(default="", description="전공")
  period: str = Field(default="", description="재학 기간")


class Certification(BaseModel):
  """자격증 한 건."""

  name: str = Field(default="", description="자격증/수료증 이름")
  issuer: str = Field(default="", description="발급 기관")
  date: str = Field(default="", description="취득일 또는 취득 연월")


class Award(BaseModel):
  """수상 이력 한 건."""

  name: str = Field(default="", description="수상 이름")
  year: str = Field(default="", description="수상 연도 (예: 2023)")
  organization: str = Field(default="", description="주최/수여 기관")
  description: str = Field(default="", description="수상 상세 설명")


class Project(BaseModel):
  """프로젝트 한 건."""

  name: str = Field(default="", description="프로젝트명")
  role: str = Field(default="", description="프로젝트 내 역할")
  period: str = Field(default="", description="진행 기간")
  description: str = Field(default="", description="프로젝트 개요 / 기여 내용")
  tech_stack: list[str] = Field(
    default_factory=list,
    description="사용한 기술 스택 목록 (snake_case 키)",
  )


class LanguageSpoken(BaseModel):
  """구사 언어 한 건."""

  language: str = Field(default="", description="언어명 (예: 영어)")
  level: str = Field(default="", description="수준 서술 (예: 비즈니스급, TOEIC 900)")


class ParsedResumeData(BaseModel):
  """이력서 분석 결과 정규화 스키마 (모든 직군 공용).

  IT 도메인 편향을 피하기 위해 `career_level` 같은 시니오리티 레이블은 포함하지 않는다.
  직군 자체는 `job_category` (한국어 라벨) 로만 표시한다.
  """

  basic_info: BasicInfo = Field(default_factory=BasicInfo)
  summary: str = Field(default="", description="한국어 1-2 문장 경력 요약")
  skills: SkillGroup = Field(default_factory=SkillGroup)
  experiences: list[Experience] = Field(default_factory=list)
  educations: list[Education] = Field(default_factory=list)
  certifications: list[Certification] = Field(default_factory=list)
  awards: list[Award] = Field(default_factory=list)
  projects: list[Project] = Field(default_factory=list)
  languages_spoken: list[LanguageSpoken] = Field(default_factory=list)
  total_experience_years: int | None = Field(
    default=None,
    description="총 경력 연차 (정수, year 부분만). 모호하면 null.",
  )
  total_experience_months: int | None = Field(
    default=None,
    description="총 경력의 month 부분 (0-11). 모호하면 null.",
  )
  industry_domains: list[str] = Field(
    default_factory=list,
    description="경험한 산업 도메인 태그 (예: 핀테크, 이커머스, 헬스케어)",
  )
  keywords: list[str] = Field(
    default_factory=list,
    description="이력서 전체에서 가장 중요한 자유 키워드 목록",
  )
  job_category: str | None = Field(
    default=None,
    description=(
      '이력서의 주된 직군 한국어 라벨. 다음 중 하나를 사용: '
      '"IT/개발", "마케팅", "디자인", "영업", "재무/회계", "인사", "기획", "CS", '
      '"디지털 마케팅", "기타".'
    ),
  )

  @classmethod
  def from_raw(cls, data: dict[str, Any] | None) -> "ParsedResumeData":
    """원시 dict → 정규화 스키마. 파싱 실패 시 기본 인스턴스 반환."""
    if not data:
      return cls()
    try:
      return cls.model_validate(data)
    except Exception:
      safe = dict(data)
      if isinstance(safe.get("skills"), list):
        safe["skills"] = {"technical": safe["skills"], "soft": [], "tools": [], "languages": []}
      safe.pop("career_level", None)
      try:
        return cls.model_validate(safe)
      except Exception:
        return cls()
