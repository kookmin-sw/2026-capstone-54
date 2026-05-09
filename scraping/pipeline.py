"""
스크래핑 파이프라인.

HTML 수집 전략 (2단계 Fallback):
  1단계: httpx 직접 HTTP 요청 (빠름, 오버헤드 없음)
  2단계: Playwright headless 브라우저 (JS 렌더링, 버튼 클릭, Cloudflare 우회)

데이터 추출:
  HTML 수집 후 LLM(GPT)을 사용해 모든 사이트의 채용 정보를 구조화하여 추출합니다.
  HTML은 LLM 전달 전 정제(노이즈 제거 + 텍스트 추출)하여 토큰을 절약합니다.
"""

import asyncio
import base64
import re
import httpx
from urllib.parse import urlparse

from playwright.async_api import Browser

from config import HTTP_TIMEOUT_SECONDS, HTTP_MAX_RETRIES, LLM_MAX_TEXT_CHARS
from extractors.llm_extractor import clean_html_to_text, extract_with_llm
from extractors.schema import JobPosting, normalize
from plugins.base import BaseScraper
from plugins.registry import get_plugin
from utils.anti_bot import get_random_user_agent, get_stealth_headers, is_bot_blocked
from utils.browser import create_page
from utils.logger import get_logger

logger = get_logger(__name__)

# HTTP 요청 없이 바로 Playwright를 사용할 도메인 목록
# 이 사이트들은 항상 JS 렌더링이 필요하므로 HTTP 시도를 스킵합니다.
_PLAYWRIGHT_ONLY_DOMAINS = {
    "wanted.co.kr",
    "saramin.co.kr",
    "jobkorea.co.kr",
    "jumpit.co.kr",
    "programmers.co.kr",
    "rocketpunch.com",
    "linkedin.com",
}


def _normalize_url(url: str) -> str:
    """
    플랫폼별 세션 의존 URL을 영구적인 직접 URL로 변환합니다.

    사람인 relay/view URL:
      https://www.saramin.co.kr/.../relay/view?...&rec_idx=12345&...
      → https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=12345
    """
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if "saramin.co.kr" in host and "/relay/view" in parsed.path:
        params = dict(p.split("=", 1) for p in parsed.query.split("&") if "=" in p)
        rec_idx = params.get("rec_idx")
        if rec_idx:
            normalized = (
                f"https://www.saramin.co.kr/zf_user/jobs/view?rec_idx={rec_idx}"
            )
            logger.info("사람인 relay URL → 직접 URL 변환: %s", normalized)
            return normalized

    return url


async def run(url: str, browser: Browser) -> JobPosting:
    """
    URL을 받아 채용 공고 데이터를 수집하고 JobPosting을 반환합니다.

    Args:
        url:     스크래핑할 채용 공고 URL
        browser: 미리 생성된 Playwright Browser 인스턴스

    Returns:
        JobPosting 데이터 클래스
    """
    url = _normalize_url(url)
    plugin = get_plugin(url)
    platform = _detect_platform(url)

    logger.info("스크래핑 시작: %s (플랫폼: %s)", url, platform)

    html: str | None = None
    iframe_htmls: list[str] = []
    iframe_texts: list[str] = []
    image_urls: list[str] = []
    iframe_is_same_domain: bool = False

    # PREFERS_BROWSER 또는 알려진 Playwright-only 도메인이면 HTTP 시도 스킵
    _host = urlparse(url).netloc.lower()
    if _host.startswith("www."):
        _host = _host[4:]
    force_playwright = any(
        _host == d or _host.endswith("." + d) for d in _PLAYWRIGHT_ONLY_DOMAINS
    )

    if plugin.PREFERS_BROWSER or force_playwright:
        # JS 렌더링이 필요한 플랫폼은 바로 Playwright 사용
        reason = (
            "PREFERS_BROWSER=True"
            if plugin.PREFERS_BROWSER
            else f"known JS-heavy domain ({_host})"
        )
        logger.info("Playwright 직접 사용 (%s)", reason)
        (
            html,
            iframe_htmls,
            iframe_texts,
            image_urls,
            iframe_is_same_domain,
        ) = await _try_playwright(url, plugin, browser)
    else:
        # 1단계: 직접 HTTP 요청
        html = await _try_direct_request(url)

        # 2단계: 봇 차단 / 구조 불완전 / 숨겨진 콘텐츠 감지 시 Playwright로 재시도
        if (
            html is None
            or is_bot_blocked(html)
            or _is_incomplete_html(html)
            or _has_expandable_content(html)
        ):
            if html is not None:
                logger.warning(
                    "봇 차단, 불완전 응답, 또는 펼치기 버튼 감지 → Playwright로 재시도"
                )
            else:
                logger.info("HTTP 요청 실패 → Playwright로 재시도")
            (
                html,
                iframe_htmls,
                iframe_texts,
                image_urls,
                iframe_is_same_domain,
            ) = await _try_playwright(url, plugin, browser)

    if not html:
        logger.error("HTML 수집 실패: %s", url)
        return normalize({}, url, platform)

    # LLM 추출: HTML 정제 → GPT 호출
    logger.info("LLM 데이터 추출 중...")
    text = clean_html_to_text(html)

    # 정제 후 텍스트가 너무 짧으면 Vision LLM 폴백으로 처리 (두 번째 Playwright 재시도 제거)
    if len(text) < 1000 and not plugin.PREFERS_BROWSER:
        logger.warning(
            "정제된 텍스트가 너무 짧음 (%d자) → Vision LLM 폴백으로 처리", len(text)
        )

    # iframe 콘텐츠 병합
    # - 동일도메인 ID매칭 iframe: 공고 본문 전용 iframe → 메인 텍스트 길이와 무관하게 항상 병합
    #   (잡코리아는 메인 페이지가 항상 사이드바/요약만 있고 실제 본문은 이 iframe에 있음)
    # - 외부도메인 iframe: 메인 텍스트가 짧을 때만 보완용으로 사용
    #   (사람인처럼 AJAX로 본문을 로드하는 경우 메인 페이지에 이미 전체 내용이 있으므로 건너뜀)
    _EXTERNAL_IFRAME_THRESHOLD = 1000  # 외부 iframe: 이 길이 미만일 때만 병합
    if iframe_texts:
        if iframe_is_same_domain or len(text) < _EXTERNAL_IFRAME_THRESHOLD:
            non_empty = [t for t in iframe_texts if t.strip()]
            if non_empty:
                text = "\n\n".join(non_empty) + "\n\n" + text
                merge_reason = (
                    "동일도메인 공고 iframe"
                    if iframe_is_same_domain
                    else f"메인 텍스트 부족 ({len(text)}자)"
                )
                logger.info(
                    "iframe %d개 텍스트 병합 (%s)", len(non_empty), merge_reason
                )
        else:
            logger.debug("외부 iframe 건너뜀 (메인 텍스트 충분: %d자)", len(text))

    # 최대 길이 제한 (iframe 병합 후 초과할 수 있음)
    if len(text) > LLM_MAX_TEXT_CHARS:
        text = text[:LLM_MAX_TEXT_CHARS]

    # 이미지 URL이 아직 없으면 메인 HTML + iframe HTML에서 추출
    if not image_urls:
        for _h in ([html] if html else []) + iframe_htmls:
            image_urls.extend(_extract_image_urls_from_html(_h))
        if image_urls:
            logger.debug("HTML/iframe에서 이미지 URL %d개 추출", len(image_urls))

    # 외부 URL 이미지를 httpx로 다운로드 → base64 변환
    # (CDN이 외부 서버 접근을 차단하여 OpenAI Vision이 직접 접근 불가한 경우 대비)
    if image_urls:
        converted_urls: list[str] = []
        _img_headers_conv = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/122.0.0.0 Safari/537.36",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            "Referer": f"https://{urlparse(url).netloc}/",
        }
        for img_url in image_urls:
            if img_url.startswith("data:"):
                converted_urls.append(img_url)
            else:
                try:
                    async with httpx.AsyncClient(
                        headers=_img_headers_conv,
                        follow_redirects=True,
                        timeout=15,
                    ) as img_client:
                        resp = await img_client.get(img_url)
                    if resp.status_code == 200 and resp.content:
                        ct = resp.headers.get("content-type", "image/jpeg")
                        b64 = base64.b64encode(resp.content).decode()
                        converted_urls.append(f"data:{ct};base64,{b64}")
                        logger.debug("이미지 base64 변환 성공: %s (%d bytes)", img_url[:80], len(resp.content))
                    else:
                        logger.debug("이미지 다운로드 실패 (HTTP %d): %s", resp.status_code, img_url[:80])
                except Exception as e:
                    logger.debug("이미지 다운로드 오류: %s — %s", img_url[:80], e)
        image_urls = converted_urls

    # Vision LLM 전달 전 광고/트래킹 URL 최종 필터링
    # (data: URL은 이미 base64 변환된 안전한 URL이므로 제외하지 않음)
    _VISION_AD_PATTERNS = (
        "doubleclick",
        "googlesyndication",
        "googletagmanager",
        "adservice",
        "amazon-adsystem",
        "pagead",
        "criteo",
        "facebook.com/tr",
        "scorecardresearch",
    )
    image_urls = [
        u
        for u in image_urls
        if u.startswith("data:") or not any(ad in u for ad in _VISION_AD_PATTERNS)
    ]

    # 이미지가 있으면 Vision OCR로 이미지 속 텍스트를 추출하여 HTML 텍스트에 보강
    # 판별 로직 없이 항상 실행 → 이미지 공고/텍스트 공고 오판 문제 제거
    if image_urls:
        logger.info("이미지 %d개 감지 → Vision OCR로 이미지 텍스트 추출 중...", len(image_urls))
        ocr_text = await _extract_text_from_images(image_urls, url)
        if ocr_text:
            logger.info("Vision OCR 완료: %d자 추출 → HTML 텍스트에 병합", len(ocr_text))
            text = ocr_text + "\n\n" + text
            # 병합 후 최대 길이 재적용
            if len(text) > LLM_MAX_TEXT_CHARS:
                text = text[:LLM_MAX_TEXT_CHARS]

    # 통합된 텍스트(HTML + OCR)를 gpt-4o-mini로 구조화 추출
    raw = await extract_with_llm(text, url)

    result = normalize(raw, url, platform)
    logger.info("스크래핑 완료: title='%s', company='%s'", result.title, result.company)
    return result


async def _extract_text_from_images(image_urls: list[str], url: str) -> str:
    """
    이미지에서 Vision OCR로 텍스트를 추출합니다.

    extract_with_vision_llm()의 1단계(OCR)만 수행하는 헬퍼 함수입니다.
    추출된 텍스트는 HTML 텍스트와 병합되어 gpt-4o-mini에 전달됩니다.

    Returns:
        이미지에서 읽어낸 텍스트. 실패 시 빈 문자열.
    """
    from extractors.llm_extractor import _split_tall_images

    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage as HMsg
        from config import OPENAI_API_KEY, OPENAI_VISION_MODEL

        if not OPENAI_API_KEY:
            return ""

        llm = ChatOpenAI(
            model=OPENAI_VISION_MODEL,
            api_key=OPENAI_API_KEY,
            temperature=0,
            max_retries=2,
        )

        target_urls = image_urls[:5]
        target_urls = _split_tall_images(target_urls)

        content: list = [
            {
                "type": "text",
                "text": (
                    "아래 이미지는 채용공고 페이지의 캡처입니다.\n"
                    "이미지에 보이는 모든 텍스트를 빠짐없이 그대로 읽어서 출력하세요.\n"
                    "표(테이블)가 있으면 각 행을 줄바꿈으로 구분하고, "
                    "열 헤더가 있으면 '헤더: 내용' 형식으로 작성하세요.\n"
                    "요약하거나 재구성하지 말고, 이미지에 보이는 텍스트를 "
                    "위에서 아래로 순서대로 그대로 출력하세요.\n"
                    "마크다운이나 코드블록 없이 순수 텍스트만 출력하세요."
                ),
            }
        ]
        for img_url in target_urls:
            content.append({
                "type": "image_url",
                "image_url": {"url": img_url, "detail": "high"},
            })

        messages = [HMsg(content=content)]

        logger.info(
            "Vision OCR 호출 (모델: %s, 이미지: %d개) — %s",
            OPENAI_VISION_MODEL, len(target_urls), url,
        )
        response = await llm.ainvoke(messages)
        ocr_text = response.content.strip()

        logger.debug("Vision OCR 결과 (앞 500자): %s", ocr_text[:500])
        return ocr_text

    except Exception as e:
        logger.warning("Vision OCR 실패: %s", e)
        return ""


async def _try_direct_request(url: str) -> str | None:
    """
    1단계: httpx를 통한 직접 HTTP GET 요청.
    연결 오류나 비정상 응답 시 None을 반환합니다.
    """
    user_agent = get_random_user_agent()
    headers = get_stealth_headers(user_agent)

    for attempt in range(1, HTTP_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(
                headers=headers,
                follow_redirects=True,
                timeout=HTTP_TIMEOUT_SECONDS,
            ) as client:
                response = await client.get(url)
                logger.debug(
                    "HTTP 응답: status=%d, size=%d bytes (시도 %d/%d)",
                    response.status_code,
                    len(response.content),
                    attempt,
                    HTTP_MAX_RETRIES,
                )

                if response.status_code in (403, 429, 503):
                    logger.warning("HTTP %d 응답 → 봇 차단 의심", response.status_code)
                    return None

                if response.status_code != 200:
                    logger.warning("HTTP %d 응답", response.status_code)
                    continue

                return response.text

        except httpx.TimeoutException:
            logger.warning("HTTP 요청 타임아웃 (시도 %d/%d)", attempt, HTTP_MAX_RETRIES)
        except httpx.RequestError as e:
            logger.warning("HTTP 요청 오류: %s", e)
            return None

    return None


async def _try_playwright(
    url: str, plugin: BaseScraper, browser: Browser
) -> tuple[str | None, list[str], list[str], list[str], bool]:
    """
    2단계: Playwright headless 브라우저로 페이지를 렌더링하고
    플러그인의 before_extract를 실행한 뒤 HTML을 반환합니다.

    Returns:
        (main_html, iframe_htmls, iframe_texts, image_urls, iframe_is_same_domain)
        - iframe_htmls:          선택된 iframe HTML 목록 (이미지 추출용)
        - iframe_texts:          iframe DOM에서 직접 추출한 텍스트 목록 (LLM 입력용)
        - image_urls:            페이지 내 이미지 목록 (이미지 공고 처리용)
        - iframe_is_same_domain: True이면 동일도메인 ID매칭 iframe (공고 본문 전용)
    """
    try:
        async with create_page(browser) as page:
            logger.debug("Playwright 페이지 로드 시작: %s", url)

            # 네비게이션 전 플러그인 셋업 (응답 인터셉터 등록 등)
            await plugin.setup(page)

            # 폰트/미디어 리소스 차단으로 페이지 로드 속도 향상
            # 이미지는 iframe 스크린샷에 필요하므로 차단하지 않음
            await page.route(
                re.compile(r"\.(woff2?|ttf|eot|otf)(\?.*)?$"),
                lambda route: route.abort(),
            )

            await page.goto(url, wait_until="domcontentloaded")

            # SPA 초기 렌더링 대기:
            # domcontentloaded → React 마운트 → useEffect API 호출 → 콘텐츠 렌더링 순서로 진행됨
            # React가 effect를 시작할 시간을 먼저 주고, 이후 networkidle로 API 완료 대기
            await page.wait_for_timeout(500)
            try:
                await page.wait_for_load_state("networkidle", timeout=8_000)
            except Exception:
                pass

            # Cloudflare JS 챌린지 감지 및 대기
            # 챌린지 통과 시 자동 리다이렉트되므로 새 페이지 로드를 기다림
            title = await page.title()
            if any(
                sig in title.lower()
                for sig in ("just a moment", "checking your browser", "ddos")
            ):
                logger.info("Cloudflare 챌린지 감지 → 자동 통과 대기 중...")
                try:
                    await page.wait_for_load_state("networkidle", timeout=10_000)
                    # 챌린지 후 실제 페이지 안착 확인
                    await page.wait_for_function(
                        "document.title !== 'Just a moment...' && "
                        "!document.title.toLowerCase().includes('checking')",
                        timeout=8_000,
                    )
                    logger.info(
                        "Cloudflare 챌린지 통과: title='%s'", await page.title()
                    )
                except Exception:
                    logger.warning("Cloudflare 챌린지 대기 타임아웃 — 현재 상태로 계속")

            # 플러그인 전처리 (더보기 클릭, API 인터셉트 대기, 정밀 스크린샷 등)
            await plugin.before_extract(page)
            # 플러그인이 직접 캡처한 이미지 (iframe 전체 스크린샷보다 우선 사용)
            plugin_images = plugin.get_captured_images()
            if plugin_images:
                logger.debug("플러그인 캡처 이미지 %d개", len(plugin_images))

            # 상호작용 후 추가 렌더링 대기
            try:
                await page.wait_for_load_state("networkidle", timeout=5_000)
            except Exception:
                pass  # 타임아웃이어도 현재 상태로 계속 진행

            # HTML 캡처를 일단 None으로 두고 iframe/스크린샷 처리 후 최신 상태로 수집
            # (jobkorea처럼 networkidle 이후에도 비동기로 콘텐츠를 로드하는 사이트 대응)
            html = None

            # iframe 콘텐츠 별도 수집
            # 잡코리아처럼 기업 채용 시스템이 외부 도메인 iframe에 있는 경우를 위해
            # 외부 도메인 iframe을 우선 수집합니다.
            # 광고/추적 도메인은 제외합니다.
            _AD_DOMAINS = (
                "doubleclick",
                "googlesyndication",
                "googletagmanager",
                "googletagservices",
                "adservice",
                "amazon-adsystem",
                "moatads",
                "scorecardresearch",
                "quantserve",
                "facebook.com",
            )
            main_domain = ".".join(urlparse(url).netloc.lower().split(".")[-2:])

            # 메인 URL에서 5자리 이상 숫자 ID 추출 (rec_idx, gi_no 등)
            main_url_str = urlparse(url).path + "?" + urlparse(url).query
            main_ids = set(re.findall(r"\b\d{5,}\b", main_url_str))

            same_domain_matched: list[str] = []  # 동일 도메인 + ID 매칭: HTML
            same_domain_matched_texts: list[
                str
            ] = []  # 동일 도메인 + ID 매칭: DOM innerText
            same_domain_frames: list = []
            external_domain: list[str] = []  # 외부 도메인: HTML
            external_domain_texts: list[str] = []  # 외부 도메인: DOM innerText
            external_frames: list = []

            async def _process_iframe(frame):
                try:
                    frame_url = frame.url
                    if not frame_url or frame_url in ("about:blank", ""):
                        return None
                    frame_host = urlparse(frame_url).netloc.lower()
                    if any(ad in frame_host for ad in _AD_DOMAINS):
                        return None
                    frame_domain = ".".join(frame_host.split(".")[-2:])
                    frame_url_str = (
                        urlparse(frame_url).path + "?" + urlparse(frame_url).query
                    )
                    frame_ids = set(re.findall(r"\b\d{5,}\b", frame_url_str))

                    try:
                        await frame.wait_for_load_state("networkidle", timeout=3_000)
                    except Exception:
                        pass
                    frame_html = await frame.content()
                    if len(frame_html) <= 500:
                        return None

                    # DOM에서 직접 텍스트 추출
                    # Next.js SPA처럼 networkidle 이후에도 AJAX로 콘텐츠를 로드하는 iframe은
                    # 이 시점에 innerText가 짧을 수 있음 → 스크린샷으로 Vision 보완
                    try:
                        frame_text = await frame.inner_text("body")
                        logger.debug("iframe innerText: %d자", len(frame_text))
                    except Exception as e:
                        logger.debug("iframe innerText 실패: %s", e)
                        frame_text = ""

                    return (
                        frame,
                        frame_html,
                        frame_text,
                        frame_domain,
                        frame_ids,
                        frame_url,
                    )
                except Exception:
                    return None

            # 모든 iframe을 병렬로 처리
            iframe_results = await asyncio.gather(
                *[_process_iframe(f) for f in page.frames[1:]],
                return_exceptions=True,
            )
            for result in iframe_results:
                if not result or isinstance(result, Exception):
                    continue
                frame, frame_html, frame_text, frame_domain, frame_ids, frame_url = (
                    result
                )
                if frame_domain == main_domain and main_ids and (main_ids & frame_ids):
                    same_domain_matched.append(frame_html)
                    same_domain_matched_texts.append(frame_text)
                    same_domain_frames.append(frame)
                    logger.debug("동일 도메인 ID 매칭 iframe: %s", frame_url)
                elif frame_domain != main_domain:
                    external_domain.append(frame_html)
                    external_domain_texts.append(frame_text)
                    external_frames.append(frame)
                    logger.debug("외부 도메인 iframe: %s", frame_url)

            # 우선순위: 동일 도메인 ID 매칭 > 외부 도메인
            # 둘을 동시에 사용하면 다른 회사 공고가 섞여 오염됨
            if same_domain_matched:
                iframe_htmls = same_domain_matched
                iframe_texts = same_domain_matched_texts
                relevant_frames = same_domain_frames
                iframe_is_same_domain = True
                logger.info("동일 도메인 ID 매칭 iframe %d개 사용", len(iframe_htmls))
            elif external_domain:
                iframe_htmls = external_domain
                iframe_texts = external_domain_texts
                relevant_frames = external_frames
                iframe_is_same_domain = False
                logger.info("외부 도메인 iframe %d개 사용 (폴백)", len(iframe_htmls))
            else:
                iframe_htmls = []
                iframe_texts = []
                relevant_frames = []
                iframe_is_same_domain = False

            # 이미지 기반 채용공고 처리: 두 단계로 이미지 수집
            #
            # 1단계: iframe HTML에서 직접 이미지 URL 추출 (우선순위 높음)
            #   - 잡코리아처럼 채용 내용이 이미지 첨부파일로 올려진 경우
            #   - 프로토콜 상대 URL (//cdn.example.com/...) 포함 처리
            #   - 직접 URL은 Vision LLM에 더 선명하게 전달됨 (페이지 크롬 없음)
            #
            # 2단계: iframe 스크린샷 (직접 URL로 추출 불가한 동적 콘텐츠용 폴백)
            #   - JS 렌더링 후 최종 화면 캡처
            #   - Playwright 컨텍스트에서 직접 캡처 → 인증 쿠키/세션 자동 적용
            direct_iframe_image_urls: list[str] = []
            for _h in iframe_htmls:
                direct_iframe_image_urls.extend(_extract_image_urls_from_html(_h))
            if direct_iframe_image_urls:
                logger.debug(
                    "iframe HTML에서 직접 이미지 URL %d개 추출",
                    len(direct_iframe_image_urls),
                )

            # iframe 스크린샷 + 텍스트 수집
            # frame_element()를 사용해 현재 DOM의 최신 iframe 요소를 참조:
            #   - iframe이 JS에 의해 동적으로 교체되더라도 항상 현재 요소를 가져옴
            #   - frame 객체는 낡은 참조(detached)가 될 수 있으므로 frame_element()로 우회
            screenshot_urls: list[str] = []

            async def _capture_frame(idx: int, frame):
                try:
                    frame_el = await frame.frame_element()
                    screenshot_b64 = None
                    try:
                        screenshot = await frame_el.screenshot(type="jpeg", quality=85)
                        if len(screenshot) > 10_000:  # 10KB 미만은 빈 화면 제외
                            b64 = base64.b64encode(screenshot).decode()
                            screenshot_b64 = f"data:image/jpeg;base64,{b64}"
                            logger.debug(
                                "iframe 스크린샷 캡처 완료 (%d bytes)", len(screenshot)
                            )
                    except Exception as e:
                        logger.debug("iframe 스크린샷 실패: %s", e)

                    # 스크린샷 이후 재시도: contentWindow로 현재 iframe 문서 텍스트 추출
                    # (frame 객체가 detached되어도 frame_element를 통해 현재 iframe 접근)
                    late_text = None
                    try:
                        late_text = await frame_el.evaluate(
                            "el => el.contentWindow && el.contentWindow.document && el.contentWindow.document.body"
                            " ? el.contentWindow.document.body.innerText : ''"
                        )
                    except Exception as e:
                        logger.debug("iframe contentWindow 실패: %s", e)

                    return (idx, screenshot_b64, late_text)
                except Exception as e:
                    logger.debug("iframe frame_element 실패: %s", e)
                    return (idx, None, None)

            # 모든 iframe 스크린샷 + contentWindow를 병렬로 처리
            capture_results = await asyncio.gather(
                *[
                    _capture_frame(idx, frame)
                    for idx, frame in enumerate(relevant_frames)
                ],
                return_exceptions=True,
            )
            for result in capture_results:
                if isinstance(result, Exception):
                    continue
                idx, screenshot_b64, late_text = result
                if screenshot_b64:
                    screenshot_urls.append(screenshot_b64)
                if late_text and len(late_text.strip()) > len(
                    iframe_texts[idx].strip()
                ):
                    logger.debug("iframe contentWindow 텍스트: %d자", len(late_text))
                    iframe_texts[idx] = late_text
                else:
                    logger.debug(
                        "iframe contentWindow: %d자 (갱신 없음)",
                        len(late_text) if late_text else 0,
                    )

            # iframe HTML에서 추출한 직접 이미지 URL을 httpx로 다운로드 → base64 변환
            # JS fetch()는 CORS로 차단되므로 서버 사이드 httpx를 사용합니다.
            # Referer 헤더를 설정해 CDN이 거부하지 않도록 합니다.
            direct_image_b64_urls: list[str] = []
            if direct_iframe_image_urls:
                _img_headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36",
                    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                    "Referer": f"https://{urlparse(url).netloc}/",
                }

                async def _download_image(
                    img_url: str, client: httpx.AsyncClient
                ) -> str | None:
                    try:
                        resp = await client.get(img_url)
                        if resp.status_code == 200 and resp.content:
                            ct = resp.headers.get("content-type", "image/jpeg")
                            b64 = base64.b64encode(resp.content).decode()
                            logger.debug(
                                "iframe 이미지 다운로드 성공: %s (%d bytes)",
                                img_url[:80],
                                len(resp.content),
                            )
                            return f"data:{ct};base64,{b64}"
                        else:
                            logger.debug(
                                "iframe 이미지 다운로드 실패 (HTTP %d): %s",
                                resp.status_code,
                                img_url[:80],
                            )
                    except Exception as e:
                        logger.debug(
                            "iframe 이미지 다운로드 오류: %s — %s", img_url[:80], e
                        )
                    return None

                async with httpx.AsyncClient(
                    headers=_img_headers,
                    follow_redirects=True,
                    timeout=10,
                ) as img_client:
                    dl_results = await asyncio.gather(
                        *[
                            _download_image(u, img_client)
                            for u in direct_iframe_image_urls
                        ],
                        return_exceptions=True,
                    )
                direct_image_b64_urls = [
                    r for r in dl_results if r and not isinstance(r, Exception)
                ]

            # 이미지 우선순위:
            #   1. 플러그인 정밀 스크린샷 (특정 요소만 캡처 → 노이즈 없음)
            #   2. iframe HTML에서 추출한 직접 이미지 URL (base64 변환)
            #   3. iframe 전체 스크린샷 (노이즈 포함 가능, 최후 수단)
            image_urls = plugin_images + direct_image_b64_urls + screenshot_urls

            # 메인 페이지 큰 이미지도 수집 (직접 URL도 스크린샷도 없는 경우 폴백)
            # httpx로 다운로드 → base64 변환 (CDN이 외부 접근을 차단하는 경우 대비)
            if not image_urls:
                try:
                    main_imgs = await page.evaluate("""
                        () => Array.from(document.querySelectorAll('img'))
                            .filter(img => {
                                const h = img.naturalHeight || img.getBoundingClientRect().height;
                                const w = img.naturalWidth  || img.getBoundingClientRect().width;
                                return h > 500 && w > 200;
                            })
                            .map(img => img.src)
                            .filter(src => src && src.startsWith('http'))
                    """)
                    if main_imgs:
                        _img_headers_main = {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                                          "Chrome/122.0.0.0 Safari/537.36",
                            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                            "Referer": f"https://{urlparse(url).netloc}/",
                        }
                        for img_url in main_imgs:
                            try:
                                async with httpx.AsyncClient(
                                    headers=_img_headers_main,
                                    follow_redirects=True,
                                    timeout=15,
                                ) as img_client:
                                    resp = await img_client.get(img_url)
                                if resp.status_code == 200 and resp.content:
                                    ct = resp.headers.get("content-type", "image/jpeg")
                                    b64 = base64.b64encode(resp.content).decode()
                                    image_urls.append(f"data:{ct};base64,{b64}")
                                    logger.debug(
                                        "메인 이미지 다운로드 성공: %s (%d bytes)",
                                        img_url[:80], len(resp.content),
                                    )
                                else:
                                    logger.debug(
                                        "메인 이미지 다운로드 실패 (HTTP %d): %s",
                                        resp.status_code, img_url[:80],
                                    )
                            except Exception as e:
                                logger.debug("메인 이미지 다운로드 오류: %s — %s", img_url[:80], e)
                except Exception:
                    pass

            if image_urls:
                logger.debug(
                    "이미지 %d개 수집 완료 (직접URL %d + 스크린샷 %d)",
                    len(image_urls),
                    len(direct_iframe_image_urls),
                    len(screenshot_urls),
                )

            # 모든 iframe 처리와 스크린샷 이후 최신 HTML 수집
            # (networkidle 이후 비동기 로드된 콘텐츠까지 포함)
            html = await page.content()
            logger.debug("Playwright HTML 수집 완료: %d bytes", len(html))

            return html, iframe_htmls, iframe_texts, image_urls, iframe_is_same_domain

    except Exception as e:
        logger.error("Playwright 오류: %s", e)
        return None, [], [], [], False


def _detect_platform(url: str) -> str:
    """URL에서 플랫폼 이름을 추출합니다."""
    try:
        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        # 알려진 플랫폼 매핑
        platform_map = {
            "wanted.co.kr": "wanted",
            "saramin.co.kr": "saramin",
            "jobkorea.co.kr": "jobkorea",
            "linkedin.com": "linkedin",
            "jumpit.co.kr": "jumpit",
            "programmers.co.kr": "programmers",
            "rocketpunch.com": "rocketpunch",
        }
        for domain, name in platform_map.items():
            if domain in host:
                return name
        # 매핑 없으면 도메인 그대로 사용
        return host.split(".")[0]
    except Exception:
        return "unknown"


def _is_image_based_posting(text: str, image_urls: list[str]) -> bool:
    """
    LLM 호출 전 사전 분류: 이미지 기반 공고인지 판단합니다.

    판단 기준 (모두 충족 시 이미지 공고로 분류):
      1. 이미지가 존재함 (image_urls가 비어있지 않음)
      2. 텍스트에 채용공고 핵심 섹션 키워드가 부족함 (1개 이하)
      3. 텍스트 내 의미 있는 문장 블록이 적음 (5줄 미만)

    이 함수는 기존 300자 고정 임계값 대신 구조적 신호를 사용하여
    사이트별 텍스트 길이 차이에 영향받지 않습니다.

    Returns:
        True: 이미지 기반 공고 → Vision LLM 직행
        False: 텍스트 기반 공고 → 텍스트 LLM 사용
    """
    # 이미지가 없으면 Vision 사용 불가 → 무조건 텍스트 추출
    if not image_urls:
        return False

    # 채용공고 핵심 섹션 키워드 (한국어 + 영어)
    _JOB_KEYWORDS = (
        "담당업무", "주요업무", "직무내용", "하는 일", "업무내용",
        "자격요건", "지원자격", "필수조건", "자격사항",
        "우대사항", "우대조건", "우대 사항",
        "responsibilities", "requirements", "qualifications", "preferred",
    )

    text_lower = text.lower()
    keyword_matches = sum(1 for kw in _JOB_KEYWORDS if kw in text_lower)

    # 키워드 2개 이상 매칭 → 텍스트에 공고 본문이 충분히 담겨있음
    if keyword_matches >= 2:
        return False

    # 의미 있는 텍스트 줄 수 확인 (10자 이상인 줄만 카운트)
    meaningful_lines = [line for line in text.splitlines() if len(line.strip()) >= 10]

    # 키워드 0~1개 + 의미 있는 줄 5개 미만 → 이미지 공고
    if len(meaningful_lines) < 5:
        logger.debug(
            "이미지 공고 판단: 키워드 %d개, 의미 있는 줄 %d개, 이미지 %d개",
            keyword_matches, len(meaningful_lines), len(image_urls),
        )
        return True

    return False


def _has_expandable_content(html: str) -> bool:
    """
    HTTP 응답 HTML에 콘텐츠를 펼치는 버튼이 있는지 확인합니다.

    일부 사이트(원티드 등)는 HTTP 응답에 일부 콘텐츠만 포함하고
    나머지는 '더 보기' 버튼 클릭 후 표시합니다.
    이 경우 어떤 필드가 숨겨져 있는지 알 수 없으므로,
    버튼 존재 여부만 확인하여 Playwright 재시도를 결정합니다.

    <button> 요소만 검사합니다 (내비게이션용 <a> 태그의 오탐 방지).
    """
    if not html:
        return False
    html_lower = html.lower()
    # <button> 태그가 있는지 먼저 빠르게 확인
    if "<button" not in html_lower:
        return False
    _MORE_KEYWORDS = (
        "더 보기",
        "더보기",
        "show more",
        "read more",
        "see more",
        "view more",
        "펼치기",
        "상세보기",
    )
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "lxml")
    for btn in soup.find_all("button"):
        text = btn.get_text(separator=" ").strip()
        if any(kw in text for kw in _MORE_KEYWORDS):
            logger.debug("펼치기 버튼 감지: '%s'", text[:50])
            return True
    return False


def _extract_image_urls_from_html(html: str) -> list[str]:
    """
    HTML에서 콘텐츠 이미지 URL을 추출합니다.

    Playwright를 거치지 않은 경우 HTTP HTML에서 직접 파싱합니다.
    아이콘·로고·트래킹 픽셀은 제외하고 콘텐츠 이미지만 반환합니다.
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "lxml")
    urls = []
    _EXCLUDE_KEYWORDS = (
        "icon",
        "logo",
        "pixel",
        "track",
        "beacon",
        "1x1",
        "spinner",
        "loading",
    )
    _AD_DOMAINS = (
        "doubleclick",
        "googlesyndication",
        "googletagmanager",
        "googletagservices",
        "adservice",
        "amazon-adsystem",
        "moatads",
        "scorecardresearch",
        "quantserve",
        "facebook.com",
        "criteo",
        "pagead",
        "adsystem",
    )
    for img in soup.find_all("img"):
        src = img.get("src", "")
        if not src:
            continue
        # 프로토콜 상대 URL (//cdn.example.com/...) → https:// 로 정규화
        if src.startswith("//"):
            src = "https:" + src
        if not src.startswith("http"):
            continue
        # 광고/트래킹 도메인 제외
        if any(ad in src.lower() for ad in _AD_DOMAINS):
            continue
        # 명시적으로 작은 이미지 제외 (width/height 속성 기준)
        try:
            if img.get("width") and int(img["width"]) < 200:
                continue
            if img.get("height") and int(img["height"]) < 100:
                continue
        except (ValueError, TypeError):
            pass
        if any(kw in src.lower() for kw in _EXCLUDE_KEYWORDS):
            continue
        urls.append(src)
    return urls


def _is_incomplete_html(html: str) -> bool:
    """
    HTTP 응답이 구조적으로 불완전한지 확인합니다.

    일부 사이트는 봇으로 의심될 때 정상 상태코드(200)를 반환하면서도
    실제 콘텐츠가 빠진 축소 HTML을 내려줍니다.
    <h1>, <h2>, og:title 중 하나도 없으면 불완전한 응답으로 판단합니다.
    """
    if not html:
        return True
    html_lower = html.lower()
    has_heading = "<h1" in html_lower or "<h2" in html_lower
    has_og_title = (
        'property="og:title"' in html_lower or "property='og:title'" in html_lower
    )
    if not has_heading and not has_og_title:
        logger.warning(
            "응답 HTML에 제목 구조(h1/h2/og:title) 없음 → 불완전 응답으로 판단"
        )
        return True
    return False
