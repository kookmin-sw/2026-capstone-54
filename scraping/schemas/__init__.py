"""
스크래핑 파이프라인 Pydantic 스키마 패키지.

모듈 구성:
    job_posting  - 채용공고 핵심 데이터 모델 (공통 기반)
    scraper      - scraper.run_scraping() I/O
    pipeline     - pipeline.run() 및 내부 수집 함수 I/O
    extractor    - LLM 추출 함수 I/O
"""

from schemas.job_posting import JobPostingSchema
from schemas.scraper import ScrapeRequest, ScrapeResult
from schemas.pipeline import (
    PipelineInput,
    DirectRequestResult,
    PlaywrightCollectResult,
    PipelineOutput,
)
from schemas.extractor import (
    CleanHTMLInput,
    CleanHTMLOutput,
    LLMExtractInput,
    VisionLLMExtractInput,
    LLMExtractOutput,
)

__all__ = [
    "JobPostingSchema",
    "ScrapeRequest",
    "ScrapeResult",
    "PipelineInput",
    "DirectRequestResult",
    "PlaywrightCollectResult",
    "PipelineOutput",
    "CleanHTMLInput",
    "CleanHTMLOutput",
    "LLMExtractInput",
    "VisionLLMExtractInput",
    "LLMExtractOutput",
]
