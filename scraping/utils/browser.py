"""
Playwright 브라우저 관리 모듈.
컨텍스트 매니저를 통해 브라우저 인스턴스를 안전하게 관리합니다.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from playwright.async_api import (
    async_playwright,
    Browser,
    BrowserContext,
    Page,
    Playwright,
)

from config import (
    HEADLESS,
    BROWSER_TIMEOUT_MS,
    NAVIGATION_TIMEOUT_MS,
)
from utils.anti_bot import get_random_user_agent, STEALTH_INIT_SCRIPT
from utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def create_browser() -> AsyncGenerator[Browser, None]:
    """Playwright Chromium 브라우저를 생성하고 종료를 보장합니다."""
    async with async_playwright() as pw:
        browser = await _launch_browser(pw)
        logger.debug("브라우저 시작 (headless=%s)", HEADLESS)
        try:
            yield browser
        finally:
            await browser.close()
            logger.debug("브라우저 종료")


@asynccontextmanager
async def create_page(browser: Browser) -> AsyncGenerator[Page, None]:
    """
    stealth 설정이 적용된 새 브라우저 컨텍스트/페이지를 생성합니다.
    컨텍스트 종료 시 자동으로 정리됩니다.
    """
    user_agent = get_random_user_agent()
    # Sec-Ch-Ua 헤더도 일반 Chrome처럼 위장 (HeadlessChrome 노출 방지)
    extra_headers = {
        "Sec-Ch-Ua": '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
    }
    context: BrowserContext = await browser.new_context(
        user_agent=user_agent,
        viewport={"width": 1920, "height": 1080},
        locale="ko-KR",
        timezone_id="Asia/Seoul",
        java_script_enabled=True,
        extra_http_headers=extra_headers,
    )

    # stealth 스크립트: 모든 페이지에 자동 적용
    await context.add_init_script(STEALTH_INIT_SCRIPT)

    page: Page = await context.new_page()
    page.set_default_timeout(BROWSER_TIMEOUT_MS)
    page.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)

    logger.debug("새 페이지 생성 (UA: %s...)", user_agent[:50])

    try:
        yield page
    finally:
        await context.close()


async def _launch_browser(pw: Playwright) -> Browser:
    """봇 탐지 우회 옵션으로 Chromium을 시작합니다."""
    return await pw.chromium.launch(
        headless=HEADLESS,
        args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",       # EC2 메모리 부족 방지
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-blink-features=AutomationControlled",  # 핵심: 자동화 플래그 비활성화
            "--disable-infobars",
            "--window-size=1920,1080",
            "--lang=ko-KR",
        ],
    )


async def block_unnecessary_resources(page: Page) -> None:
    """
    이미지, 폰트, 미디어 등 불필요한 리소스를 차단하여 로딩 속도를 높입니다.
    일부 사이트는 이미지 로딩 여부로 봇을 판단하므로 기본 비활성화.
    필요한 플러그인에서 호출하여 선택적으로 사용합니다.
    """
    await page.route(
        "**/*",
        lambda route: (
            route.abort()
            if route.request.resource_type in {"image", "media", "font", "stylesheet"}
            else route.continue_()
        ),
    )
