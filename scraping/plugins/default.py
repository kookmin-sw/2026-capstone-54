"""
범용 Default 플러그인.

지원하는 플랫폼 플러그인이 없을 때 사용하는 폴백 스크래퍼입니다.
데이터 추출은 LLM이 담당하므로, 여기서는 페이지 전처리만 수행합니다.
"""

from playwright.async_api import Page

from plugins.base import BaseScraper
from utils.anti_bot import random_delay


class DefaultScraper(BaseScraper):
    """모든 도메인에 적용 가능한 범용 스크래퍼 (폴백)."""

    DOMAINS: list[str] = []  # 매칭 도메인 없음 (폴백용)

    async def before_extract(self, page: Page) -> None:
        """
        페이지 전처리:
        1. 전체 스크롤 → 지연 로딩(lazy loading) 콘텐츠 강제 렌더링
        2. 더보기 버튼 클릭 → 숨겨진 내용 펼치기
        """
        await random_delay(600, 1200)

        # 페이지 전체를 천천히 스크롤하여 lazy loading 콘텐츠를 모두 렌더링
        await page.evaluate("""
            async () => {
                const delay = ms => new Promise(r => setTimeout(r, ms));
                const scrollHeight = document.body.scrollHeight;
                const step = Math.floor(scrollHeight / 5);
                for (let pos = 0; pos <= scrollHeight; pos += step) {
                    window.scrollTo(0, pos);
                    await delay(300);
                }
                window.scrollTo(0, 0);
            }
        """)
        await random_delay(500, 800)

        # 더보기 버튼 클릭
        selectors = [
            "button:has-text('더 보기')",
            "button:has-text('더보기')",
            "button:has-text('상세보기')",
            "button:has-text('show more')",
            "button:has-text('read more')",
            "[class*='more'][role='button']",
            "a:has-text('더보기')",
            "a:has-text('상세보기')",
        ]

        for selector in selectors:
            try:
                buttons = await page.query_selector_all(selector)
                for btn in buttons:
                    if await btn.is_visible():
                        await btn.click()
                        await random_delay(300, 600)
            except Exception:
                pass
