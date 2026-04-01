"""
Celery 앱 설정.

Worker 프로세스당 Chromium 브라우저를 1개 미리 기동하여 재사용합니다.
동시 스크래핑 수는 --concurrency 인자(= SCRAPER_CONCURRENCY 환경변수)로 제어합니다.

실행 예시:
    celery -A celery_app worker -Q scraping -l INFO --concurrency 2
"""

import asyncio
import os

from celery import Celery
from celery.signals import worker_process_init, worker_process_shutdown

from utils.logger import get_logger

logger = get_logger(__name__)

app = Celery("scraping")
app.conf.update(
    broker_url=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    result_backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_default_queue="scraping",
    # 한 번에 하나씩 가져와서 브라우저 병목 방지
    worker_prefetch_multiplier=1,
    # 작업 완료 후 ack (중간에 worker 죽어도 재처리 가능)
    task_acks_late=True,
    task_soft_time_limit=120,  # 120초 후 SoftTimeLimitExceeded
    task_time_limit=150,       # 150초 후 강제 종료
    result_expires=3600,       # 결과 1시간 보관
    include=["tasks"],         # flat 모듈 tasks.py 를 worker 시작 시 임포트
)

# ──────────────────────────────────────────────
# Worker 프로세스별 브라우저 상태
# (prefork: 각 프로세스가 독립적으로 보유)
# ──────────────────────────────────────────────
_event_loop: asyncio.AbstractEventLoop | None = None
_playwright = None
_browser = None


@worker_process_init.connect
def _init_browser(**kwargs):
    """Worker 프로세스 시작 시 Chromium을 미리 기동합니다."""
    global _event_loop, _playwright, _browser

    from playwright.async_api import async_playwright
    from utils.browser import _launch_browser

    async def _start():
        global _playwright, _browser
        _playwright = await async_playwright().start()
        _browser = await _launch_browser(_playwright)
        logger.info("브라우저 초기화 완료 (pid=%d)", os.getpid())

    _event_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(_event_loop)
    _event_loop.run_until_complete(_start())


@worker_process_shutdown.connect
def _shutdown_browser(**kwargs):
    """Worker 프로세스 종료 시 Chromium을 정리합니다."""
    global _event_loop, _playwright, _browser

    async def _stop():
        if _browser:
            await _browser.close()
        if _playwright:
            await _playwright.stop()

    if _event_loop and not _event_loop.is_closed():
        _event_loop.run_until_complete(_stop())
        _event_loop.close()
    logger.info("브라우저 종료 완료 (pid=%d)", os.getpid())
