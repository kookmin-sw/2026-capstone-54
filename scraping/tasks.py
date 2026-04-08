"""
Celery 스크래핑 태스크.

실제 스크래핑 로직은 scraper.run_scraping() 에 있습니다.
main.py(로컬 CLI)와 동일한 함수를 사용하므로, 두 환경의 동작이 일치합니다.

결과 확인 방법 (DB 연동 전)
─────────────────────────────────────────────────────────────
1. kubectl logs
       kubectl logs -n mefit-backend-production \\
         -l app=mefit-production-scraper-worker -f
   → 태스크 완료 시 결과 JSON이 통째로 출력됩니다.

2. Flower 웹 UI
   Django admin 로그인 후 https://<도메인>/admin/flower/ 접근

3. Celery shell (로컬 테스트)
       from celery_app import app
       from celery.result import AsyncResult
       r = AsyncResult("<task_id>", app=app)
       print(r.status, r.result)
─────────────────────────────────────────────────────────────
"""

import json
from datetime import datetime, timezone
from sqlalchemy import update
from db.connection import get_session
from schemas import JobDescriptionTable

import celery_app as _app_module
from celery_app import app
from scraper import run_scraping
from utils.logger import get_logger

logger = get_logger(__name__)


@app.task(
    bind=True,
    name="scraping.tasks.scrape_job_posting",
    max_retries=2,
    default_retry_delay=120,
)
def scrape_job_posting(self, job_description_id: int, url: str) -> dict:
    """
    채용공고 URL을 스크래핑하여 job_descriptions 테이블에 저장합니다.

    Args:
        job_description_id: backend/ DB의 job_descriptions.id (backend에서 생성된 레코드)
        url: 스크래핑할 채용공고 URL

    Returns:
        JobPosting 필드 dict — Celery result backend(Redis)에 task_id 키로 저장됩니다.
    """
    logger.info("스크래핑 시작 [task_id=%s] id=%s url=%s", self.request.id, job_description_id, url)

    loop = _app_module._event_loop
    browser = _app_module._browser

    if not browser or not browser.is_connected():
        logger.warning("브라우저 연결 끊김 — 재시작 중")
        loop.run_until_complete(_restart_browser())
        browser = _app_module._browser

    _update_status(job_description_id, "in_progress")

    try:
        result = loop.run_until_complete(run_scraping(url, browser))
        logger.info(
            "스크래핑 완료 [task_id=%s]\n%s",
            self.request.id,
            json.dumps(result, ensure_ascii=False, indent=2),
        )
        _save_to_db(job_description_id, result)
        return result
    except Exception as exc:
        logger.error("스크래핑 실패 [task_id=%s]: %s", self.request.id, exc, exc_info=True)
        _update_status(job_description_id, "error", error_message=str(exc))
        raise self.retry(exc=exc)


def _update_status(job_description_id: int, status: str, error_message: str = "") -> None:
    """job_descriptions 레코드의 collection_status를 업데이트한다."""

    values: dict = {"collection_status": status, "updated_at": datetime.now(timezone.utc)}
    if error_message:
        values["error_message"] = error_message

    with get_session() as session:
        session.execute(
            update(JobDescriptionTable)
            .where(JobDescriptionTable.id == job_description_id)
            .values(**values)
        )


def _save_to_db(job_description_id: int, result: dict) -> None:
    """스크래핑 결과를 job_descriptions 레코드에 저장한다."""
    now = datetime.now(timezone.utc)
    with get_session() as session:
        session.execute(
            update(JobDescriptionTable)
            .where(JobDescriptionTable.id == job_description_id)
            .values(
                platform=result.get("platform", ""),
                company=result.get("company", ""),
                title=result.get("title", ""),
                duties=result.get("duties", ""),
                requirements=result.get("requirements", ""),
                preferred=result.get("preferred", ""),
                work_type=result.get("work_type", ""),
                salary=result.get("salary", ""),
                location=result.get("location", ""),
                education=result.get("education", ""),
                experience=result.get("experience", ""),
                collection_status="done",
                scraped_at=now,
                error_message="",
                updated_at=now,
            )
        )

    logger.info("DB 저장 완료 [id=%s]", job_description_id)


async def _restart_browser():
    """브라우저가 비정상 종료됐을 때 재기동합니다."""
    from playwright.async_api import async_playwright
    from utils.browser import _launch_browser

    if _app_module._playwright:
        try:
            await _app_module._playwright.stop()
        except Exception:
            pass

    _app_module._playwright = await async_playwright().start()
    _app_module._browser = await _launch_browser(_app_module._playwright)
    logger.info("브라우저 재시작 완료")
