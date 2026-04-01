"""
플러그인 베이스 클래스.
모든 플랫폼별 플러그인은 이 클래스를 상속하여 구현합니다.

역할:
  - PREFERS_BROWSER: HTTP vs Playwright 선택 신호
  - before_extract:  HTML 수집 전 버튼 클릭 등 페이지 전처리
  데이터 추출은 LLM(extractors/llm_extractor.py)이 담당합니다.
"""

from playwright.async_api import Page
from utils.logger import get_logger


class BaseScraper:
    """채용공고 스크래퍼 기반 클래스."""

    # 매칭할 도메인 목록. 예: ["wanted.co.kr"]
    DOMAINS: list[str] = []

    # True: HTTP 시도 없이 바로 Playwright 사용 (React SPA 등)
    # False: HTTP 먼저 시도 → 실패 시 Playwright로 자동 폴백
    PREFERS_BROWSER: bool = False

    def __init__(self) -> None:
        self.logger = get_logger(self.__class__.__name__)

    async def setup(self, page: Page) -> None:
        """
        page.goto() 이전 호출. 네트워크 응답 인터셉터 등록 등에 사용합니다.
        필요 없으면 오버라이드하지 않아도 됩니다.
        """

    async def before_extract(self, page: Page) -> None:
        """
        Playwright 페이지 로드 후 HTML 수집 전 전처리 단계.
        더보기 버튼 클릭, 무한 스크롤 처리 등에 사용합니다.
        필요 없으면 오버라이드하지 않아도 됩니다.
        """

    def get_captured_images(self) -> list[str]:
        """
        플러그인이 직접 캡처한 이미지 base64 data URL 목록을 반환합니다.
        (iframe 전체 스크린샷 대신 특정 요소만 캡처할 때 활용)
        기본 구현은 빈 목록을 반환합니다.
        """
        return []

    @classmethod
    def matches(cls, domain: str) -> bool:
        """주어진 도메인이 이 플러그인에 해당하는지 확인합니다."""
        return any(d in domain for d in cls.DOMAINS)
