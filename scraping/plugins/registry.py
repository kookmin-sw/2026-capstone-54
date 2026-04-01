"""
플러그인 레지스트리.
도메인별 전용 플러그인을 등록하고 URL에 맞는 플러그인을 반환합니다.
"""

from urllib.parse import urlparse

from plugins.base import BaseScraper
from plugins.default import DefaultScraper
from plugins.jobkorea import JobkoreaScraper
from plugins.jobplanet import JobplanetScraper
from utils.logger import get_logger

logger = get_logger(__name__)

# 도메인 → 플러그인 클래스 매핑 (등록 순서대로 매칭)
_PLUGINS: list[type[BaseScraper]] = [
    JobkoreaScraper,
    JobplanetScraper,
]


def get_plugin(url: str) -> BaseScraper:
    """URL 도메인에 맞는 플러그인을 반환합니다. 없으면 DefaultScraper."""
    try:
        domain = urlparse(url).netloc.lower()
    except Exception:
        domain = ""

    for plugin_cls in _PLUGINS:
        if plugin_cls.matches(domain):
            logger.info("도메인 감지: %s → 플러그인 선택: %s", domain, plugin_cls.__name__)
            return plugin_cls()

    logger.info("플러그인 선택: DefaultScraper")
    return DefaultScraper()
