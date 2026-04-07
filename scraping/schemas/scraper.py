"""
scraper.run_scraping() I/O 스키마.

함수 시그니처:
    async def run_scraping(url: str, browser: Browser) -> dict
"""

from pydantic import BaseModel, Field
from schemas.job_posting import JobPostingSchema


class ScrapeRequest(BaseModel):
    """
    scraper.run_scraping() 입력 스키마.

    browser 인스턴스는 Playwright 객체라 직렬화 불가 → url만 포함합니다.
    """

    url: str = Field(description="스크래핑할 채용공고 URL")


class ScrapeResult(JobPostingSchema):
    """
    scraper.run_scraping() 출력 스키마.

    JobPostingSchema를 그대로 상속합니다.
    run_scraping()이 반환하는 dict는 이 모델의 필드와 1:1 대응합니다.
    """