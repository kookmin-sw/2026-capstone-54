"""
스크래핑 파이프라인.

HTML 수집 전략 (2단계 Fallback):
  1단계: httpx 직접 HTTP 요청 (빠름, 오버헤드 없음)
  2단계: Playwright headless 브라우저 (JS 렌더링, 버튼 클릭, Cloudflare 우회)

데이터 추출:
  HTML 수집 후 LLM(GPT)을 사용해 모든 사이트의 채용 정보를 구조화하여 추출합니다.
  HTML은 LLM 전달 전 정제(노이즈 제거 + 텍스트 추출)하여 토큰을 절약합니다.
"""

import base64
import re
import httpx
from urllib.parse import urlparse

from playwright.async_api import Browser

from config import HTTP_TIMEOUT_SECONDS, HTTP_MAX_RETRIES, LLM_MAX_TEXT_CHARS
from extractors.llm_extractor import clean_html_to_text, extract_with_llm, extract_with_vision_llm
from extractors.schema import JobPosting, normalize
from plugins.base import BaseScraper
from plugins.registry import get_plugin
from utils.anti_bot import get_random_user_agent, get_stealth_headers, is_bot_blocked
from utils.browser import create_page
from utils.logger import get_logger

logger = get_logger(__name__)


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
            normalized = f"https://www.saramin.co.kr/zf_user/jobs/view?rec_idx={rec_idx}"
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

    if plugin.PREFERS_BROWSER:
        # JS 렌더링이 필요한 플랫폼은 바로 Playwright 사용
        logger.info("Playwright 직접 사용 (PREFERS_BROWSER=True)")
        html, iframe_htmls, iframe_texts, image_urls, iframe_is_same_domain = await _try_playwright(url, plugin, browser)
    else:
        # 1단계: 직접 HTTP 요청
        html = await _try_direct_request(url)

        # 2단계: 봇 차단 / 구조 불완전 / 숨겨진 콘텐츠 감지 시 Playwright로 재시도
        if html is None or is_bot_blocked(html) or _is_incomplete_html(html) or _has_expandable_content(html):
            if html is not None:
                logger.warning("봇 차단, 불완전 응답, 또는 펼치기 버튼 감지 → Playwright로 재시도")
            else:
                logger.info("HTTP 요청 실패 → Playwright로 재시도")
            html, iframe_htmls, iframe_texts, image_urls, iframe_is_same_domain = await _try_playwright(url, plugin, browser)

    if not html:
        logger.error("HTML 수집 실패: %s", url)
        return normalize({}, url, platform)

    # LLM 추출: HTML 정제 → GPT 호출
    logger.info("LLM 데이터 추출 중...")
    text = clean_html_to_text(html)

    # 정제 후 텍스트가 너무 짧으면 JS SPA 또는 이미지 공고 가능성 → Playwright로 재시도
    if len(text) < 1000 and not plugin.PREFERS_BROWSER:
        logger.warning("정제된 텍스트가 너무 짧음 (%d자) → JS SPA 의심, Playwright로 재시도", len(text))
        html, iframe_htmls, iframe_texts, image_urls, iframe_is_same_domain = await _try_playwright(url, plugin, browser)
        if html:
            text = clean_html_to_text(html)

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
                merge_reason = "동일도메인 공고 iframe" if iframe_is_same_domain else f"메인 텍스트 부족 ({len(text)}자)"
                logger.info("iframe %d개 텍스트 병합 (%s)", len(non_empty), merge_reason)
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

    # Vision LLM 전달 전 광고/트래킹 URL 최종 필터링
    # (data: URL은 이미 base64 변환된 안전한 URL이므로 제외하지 않음)
    _VISION_AD_PATTERNS = (
        "doubleclick", "googlesyndication", "googletagmanager",
        "adservice", "amazon-adsystem", "pagead", "criteo",
        "facebook.com/tr", "scorecardresearch",
    )
    image_urls = [
        u for u in image_urls
        if u.startswith("data:") or not any(ad in u for ad in _VISION_AD_PATTERNS)
    ]

    # 텍스트가 매우 짧으면 바로 Vision 사용
    _VISION_TEXT_THRESHOLD = 300
    if len(text) < _VISION_TEXT_THRESHOLD and image_urls:
        logger.info("텍스트 부족 (%d자) + 이미지 있음 → Vision LLM으로 처리", len(text))
        raw = await extract_with_vision_llm(image_urls, url)
    else:
        # 텍스트 기반 LLM 추출
        raw = await extract_with_llm(text, url)

        # iframe 스크린샷이 있고 공고 본문 핵심 필드가 부실할 때 Vision으로 보완:
        #   - duties/preferred 모두 비어있음 → 이미지 기반 공고
        #   - duties가 너무 짧음(< 50자) + preferred 없음 → SPA 비동기 로딩으로 텍스트 미수집
        duties_val = raw.get("duties", "")
        preferred_val = raw.get("preferred", "")
        duties_insufficient = not duties_val or len(duties_val) < 50
        if duties_insufficient and not preferred_val and image_urls:
            if not duties_val:
                logger.info("duties/preferred 비어 있음 + 이미지 있음 → Vision LLM으로 보완")
            else:
                logger.info("duties 너무 짧음 (%d자) + 이미지 있음 → Vision LLM으로 보완", len(duties_val))
            vision_raw = await extract_with_vision_llm(image_urls, url)
            # Vision 결과로 빈/부족한 필드 채우기
            for field in ("duties", "preferred", "requirements", "title", "company",
                          "work_type", "salary", "location", "education", "experience"):
                if vision_raw.get(field) and (
                    not raw.get(field) or
                    (field == "duties" and len(raw.get("duties", "")) < 50)
                ):
                    raw[field] = vision_raw[field]

    result = normalize(raw, url, platform)
    logger.info("스크래핑 완료: title='%s', company='%s'", result.title, result.company)
    return result


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
                    response.status_code, len(response.content), attempt, HTTP_MAX_RETRIES
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

            await page.goto(url, wait_until="domcontentloaded")

            # SPA 초기 렌더링 대기:
            # domcontentloaded → React 마운트 → useEffect API 호출 → 콘텐츠 렌더링 순서로 진행됨
            # React가 effect를 시작할 시간을 먼저 주고, 이후 networkidle로 API 완료 대기
            await page.wait_for_timeout(2_000)
            try:
                await page.wait_for_load_state("networkidle", timeout=15_000)
            except Exception:
                pass

            # Cloudflare JS 챌린지 감지 및 대기
            # 챌린지 통과 시 자동 리다이렉트되므로 새 페이지 로드를 기다림
            title = await page.title()
            if any(sig in title.lower() for sig in ("just a moment", "checking your browser", "ddos")):
                logger.info("Cloudflare 챌린지 감지 → 자동 통과 대기 중...")
                try:
                    await page.wait_for_load_state("networkidle", timeout=20_000)
                    # 챌린지 후 실제 페이지 안착 확인
                    await page.wait_for_function(
                        "document.title !== 'Just a moment...' && "
                        "!document.title.toLowerCase().includes('checking')",
                        timeout=15_000,
                    )
                    logger.info("Cloudflare 챌린지 통과: title='%s'", await page.title())
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
                await page.wait_for_load_state("networkidle", timeout=10_000)
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
                "doubleclick", "googlesyndication", "googletagmanager",
                "googletagservices", "adservice", "amazon-adsystem",
                "moatads", "scorecardresearch", "quantserve", "facebook.com",
            )
            main_domain = ".".join(urlparse(url).netloc.lower().split(".")[-2:])

            # 메인 URL에서 5자리 이상 숫자 ID 추출 (rec_idx, gi_no 등)
            main_url_str = urlparse(url).path + "?" + urlparse(url).query
            main_ids = set(re.findall(r"\b\d{5,}\b", main_url_str))

            same_domain_matched: list[str] = []        # 동일 도메인 + ID 매칭: HTML
            same_domain_matched_texts: list[str] = []   # 동일 도메인 + ID 매칭: DOM innerText
            same_domain_frames: list = []
            external_domain: list[str] = []              # 외부 도메인: HTML
            external_domain_texts: list[str] = []        # 외부 도메인: DOM innerText
            external_frames: list = []

            for frame in page.frames[1:]:  # 첫 번째는 메인 페이지
                try:
                    frame_url = frame.url
                    if not frame_url or frame_url in ("about:blank", ""):
                        continue
                    frame_host = urlparse(frame_url).netloc.lower()
                    if any(ad in frame_host for ad in _AD_DOMAINS):
                        continue
                    frame_domain = ".".join(frame_host.split(".")[-2:])
                    frame_url_str = urlparse(frame_url).path + "?" + urlparse(frame_url).query
                    frame_ids = set(re.findall(r"\b\d{5,}\b", frame_url_str))

                    try:
                        await frame.wait_for_load_state("networkidle", timeout=8_000)
                    except Exception:
                        pass
                    frame_html = await frame.content()
                    if len(frame_html) <= 500:
                        continue

                    # DOM에서 직접 텍스트 추출
                    # Next.js SPA처럼 networkidle 이후에도 AJAX로 콘텐츠를 로드하는 iframe은
                    # 이 시점에 innerText가 짧을 수 있음 → 스크린샷으로 Vision 보완
                    try:
                        frame_text = await frame.inner_text("body")
                        logger.debug("iframe innerText: %d자", len(frame_text))
                    except Exception as e:
                        logger.debug("iframe innerText 실패: %s", e)
                        frame_text = ""

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
                except Exception:
                    pass

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
            updated_iframe_texts = list(iframe_texts)  # 기존 수집 텍스트 복사 (교체 전 값)
            for idx, frame in enumerate(relevant_frames):
                try:
                    frame_el = await frame.frame_element()
                    screenshot = await frame_el.screenshot(type="jpeg", quality=85)
                    if len(screenshot) > 10_000:  # 10KB 미만은 빈 화면 제외
                        b64 = base64.b64encode(screenshot).decode()
                        screenshot_urls.append(f"data:image/jpeg;base64,{b64}")
                        logger.debug("iframe 스크린샷 캡처 완료 (%d bytes)", len(screenshot))

                    # 스크린샷 이후 재시도: contentWindow로 현재 iframe 문서 텍스트 추출
                    # (frame 객체가 detached되어도 frame_element를 통해 현재 iframe 접근)
                    try:
                        late_text = await frame_el.evaluate(
                            "el => el.contentWindow && el.contentWindow.document && el.contentWindow.document.body"
                            " ? el.contentWindow.document.body.innerText : ''"
                        )
                        if late_text and len(late_text.strip()) > len(iframe_texts[idx].strip()):
                            logger.debug("iframe contentWindow 텍스트: %d자", len(late_text))
                            iframe_texts[idx] = late_text
                        else:
                            logger.debug("iframe contentWindow: %d자 (갱신 없음)", len(late_text) if late_text else 0)
                    except Exception as e:
                        logger.debug("iframe contentWindow 실패: %s", e)
                except Exception as e:
                    logger.debug("iframe 스크린샷 실패: %s", e)

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
                for img_url in direct_iframe_image_urls:
                    try:
                        async with httpx.AsyncClient(
                            headers=_img_headers,
                            follow_redirects=True,
                            timeout=15,
                        ) as img_client:
                            resp = await img_client.get(img_url)
                        if resp.status_code == 200 and resp.content:
                            ct = resp.headers.get("content-type", "image/jpeg")
                            b64 = base64.b64encode(resp.content).decode()
                            direct_image_b64_urls.append(f"data:{ct};base64,{b64}")
                            logger.debug(
                                "iframe 이미지 다운로드 성공: %s (%d bytes)",
                                img_url[:80], len(resp.content),
                            )
                        else:
                            logger.debug(
                                "iframe 이미지 다운로드 실패 (HTTP %d): %s",
                                resp.status_code, img_url[:80],
                            )
                    except Exception as e:
                        logger.debug("iframe 이미지 다운로드 오류: %s — %s", img_url[:80], e)

            # 이미지 우선순위:
            #   1. 플러그인 정밀 스크린샷 (특정 요소만 캡처 → 노이즈 없음)
            #   2. iframe HTML에서 추출한 직접 이미지 URL (base64 변환)
            #   3. iframe 전체 스크린샷 (노이즈 포함 가능, 최후 수단)
            image_urls = plugin_images + direct_image_b64_urls + screenshot_urls

            # 메인 페이지 큰 이미지도 수집 (직접 URL도 스크린샷도 없는 경우 폴백)
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
                    image_urls.extend(main_imgs)
                except Exception:
                    pass

            if image_urls:
                logger.debug("이미지 %d개 수집 완료 (직접URL %d + 스크린샷 %d)",
                             len(image_urls), len(direct_iframe_image_urls), len(screenshot_urls))

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
    _MORE_KEYWORDS = ("더 보기", "더보기", "show more", "read more", "see more", "view more", "펼치기", "상세보기")
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
    _EXCLUDE_KEYWORDS = ("icon", "logo", "pixel", "track", "beacon", "1x1", "spinner", "loading")
    _AD_DOMAINS = (
        "doubleclick", "googlesyndication", "googletagmanager", "googletagservices",
        "adservice", "amazon-adsystem", "moatads", "scorecardresearch",
        "quantserve", "facebook.com", "criteo", "pagead", "adsystem",
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
    has_og_title = 'property="og:title"' in html_lower or "property='og:title'" in html_lower
    if not has_heading and not has_og_title:
        logger.warning("응답 HTML에 제목 구조(h1/h2/og:title) 없음 → 불완전 응답으로 판단")
        return True
    return False
