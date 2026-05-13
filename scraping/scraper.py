"""
스크래핑 공통 진입점.

main.py(로컬 CLI)와 tasks.py(Celery Worker) 양쪽에서 동일하게 사용합니다.
브라우저 인스턴스 생명주기는 각 환경이 책임지고, 실제 스크래핑 로직은 여기서만 정의합니다.
"""

from playwright.async_api import Browser

import pipeline
from utils.logger import get_logger

logger = get_logger(__name__)


async def run_scraping(url: str, browser: Browser) -> dict:
    """
    URL을 스크래핑하여 결과 dict를 반환합니다.

    Args:
        url:     스크래핑할 채용공고 URL
        browser: 호출자가 관리하는 Playwright Browser 인스턴스
                 - main.py   : create_browser() 컨텍스트 매니저로 생성
                 - tasks.py  : worker_process_init 으로 미리 기동된 브라우저

    Returns:
        JobPosting 필드 dict (title, company, duties, requirements, ...)
    """
    logger.info("파이프라인 실행: %s", url)
    job_posting = await pipeline.run(url, browser)
    return job_posting.to_dict()
