"""
채용 공고 데이터 스키마 정의 및 정규화.
플러그인에서 반환한 raw dict를 표준 JobPosting 구조로 변환합니다.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone


@dataclass
class JobPosting:
    """채용 공고 표준 스키마."""

    # 기본 정보
    url: str = ""
    platform: str = ""
    company: str = ""
    title: str = ""

    # 공고 내용
    duties: str = ""          # 담당 업무
    requirements: str = ""    # 지원 자격
    preferred: str = ""       # 우대 사항

    # 근무 조건
    work_type: str = ""       # 근무 형태 (정규직/계약직 등)
    salary: str = ""          # 급여
    location: str = ""        # 근무 지역
    education: str = ""       # 학력 기준
    experience: str = ""      # 경력 기준

    # 메타 정보
    scraped_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        return asdict(self)


def normalize(raw: dict, url: str, platform: str) -> JobPosting:
    """
    플러그인 반환 dict를 JobPosting으로 변환합니다.
    - 빈 값은 빈 문자열로 통일
    - 공백/개행 정리
    """
    def clean(value) -> str:
        if not value:
            return ""
        return str(value).strip()

    return JobPosting(
        url=url,
        platform=platform,
        company=clean(raw.get("company")),
        title=clean(raw.get("title")),
        duties=clean(raw.get("duties")),
        requirements=clean(raw.get("requirements")),
        preferred=clean(raw.get("preferred")),
        work_type=clean(raw.get("work_type")),
        salary=clean(raw.get("salary")),
        location=clean(raw.get("location")),
        education=clean(raw.get("education")),
        experience=clean(raw.get("experience")),
    )
