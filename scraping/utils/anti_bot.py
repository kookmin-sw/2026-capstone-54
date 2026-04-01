"""
봇 탐지 우회 유틸리티.
User-Agent 로테이션, 랜덤 딜레이, 브라우저 핑거프린트 마스킹을 처리합니다.
"""

import asyncio
import random
from fake_useragent import UserAgent
from utils.logger import get_logger

logger = get_logger(__name__)

_ua = UserAgent(browsers=["chrome", "firefox", "edge"])


def get_random_user_agent() -> str:
    """실제 브라우저 User-Agent를 랜덤 반환."""
    try:
        return _ua.random
    except Exception:
        # fake-useragent 실패 시 안전한 기본값 사용
        return (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )


async def random_delay(min_ms: int = 500, max_ms: int = 1500) -> None:
    """봇 탐지 방지를 위한 랜덤 딜레이."""
    delay = random.randint(min_ms, max_ms) / 1000
    await asyncio.sleep(delay)


def get_stealth_headers(user_agent: str) -> dict[str, str]:
    """실제 브라우저처럼 보이는 HTTP 헤더 반환.

    Sec-Fetch-* 와 Cache-Control 은 브라우저 내비게이션 전용 헤더로,
    일부 사이트에서 역으로 봇 판별에 활용하므로 HTTP 요청에서는 제외합니다.
    (Playwright 브라우저에서는 자동으로 붙으므로 별도 설정 불필요)
    """
    return {
        "User-Agent": user_agent,
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;"
            "q=0.9,image/avif,image/webp,*/*;q=0.8"
        ),
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        # Accept-Encoding 미설정: 일부 CDN/Cloudflare가 이 헤더 조합으로
        # 봇 판별을 하여 축소 응답을 내려주는 케이스가 있음.
        # httpx는 이 헤더 없이도 압축 응답을 자동 처리함.
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }


# Playwright 페이지에 적용할 stealth 스크립트
# navigator.webdriver 등 자동화 흔적을 숨깁니다
STEALTH_INIT_SCRIPT = """
() => {
    // webdriver 플래그 제거
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
    });

    // Chrome 런타임 객체 추가 (headless에서 누락됨)
    window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {},
    };

    // 플러그인 목록 위장
    Object.defineProperty(navigator, 'plugins', {
        get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' },
        ],
    });

    // 언어 설정
    Object.defineProperty(navigator, 'languages', {
        get: () => ['ko-KR', 'ko', 'en-US', 'en'],
    });

    // permissions API 위장
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);
}
"""


def is_bot_blocked(html: str) -> bool:
    """
    응답 HTML에서 봇 차단 징후를 감지합니다.
    차단된 경우 True를 반환합니다.
    """
    if not html or len(html.strip()) < 200:
        return True

    block_signatures = [
        "access denied",
        "403 forbidden",
        "cloudflare",
        "cf-browser-verification",
        "just a moment",         # Cloudflare challenge
        "checking your browser",
        "ddos protection",
        "보안 문자를 입력",
        "자동화된 요청",
        "robot or human",
        "captcha",
        "recaptcha",
    ]

    html_lower = html.lower()
    for sig in block_signatures:
        if sig in html_lower:
            logger.warning("봇 차단 감지: '%s' 패턴 발견", sig)
            return True

    return False
