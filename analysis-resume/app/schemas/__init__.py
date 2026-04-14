"""analysis-resume 가 사용하는 데이터 스키마.

DB 매핑은 backend Django 가 소유하며 analysis-resume 은 DB 를 전혀 건드리지 않는다.
이 패키지는 LLM 구조화 출력 계약(`ParsedResumeData`) 만 제공한다.
"""

from app.schemas.parsed_data import ParsedResumeData

__all__ = [
    "ParsedResumeData",
]
