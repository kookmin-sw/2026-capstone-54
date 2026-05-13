"""
잡코리아(jobkorea.co.kr) 전용 플러그인.

잡코리아 채용 상세 페이지는 담당업무/자격조건 등 핵심 내용을
Next.js SPA 기반의 iframe(GI_Read_Comt_Ifrm)에 렌더링합니다.

iframe 동작 방식:
  - 서버가 내려주는 초기 HTML에 이미 내용이 포함되어 있음
  - 단, Tailwind `invisible`(visibility:hidden) 클래스가 적용되어 있어
    React가 하이드레이션하기 전까지 DOM 텍스트 접근 불가
  - React 하이드레이션 완료 후 `invisible` 클래스가 제거되며 콘텐츠가 가시화됨

전략:
  1. `#detail-content:not(.invisible)` 셀렉터가 매칭될 때까지 대기 (React 하이드레이션 완료)
  2. 텍스트 기반 공고: `detail-content`의 textContent를 메인 DOM에 주입
  3. 이미지 기반 공고: `detail-content` 요소만 정밀 스크린샷 (전체 iframe 스크린샷 지양)
     → 전체 iframe 스크린샷은 상품 사진 등 부수 콘텐츠 포함으로 Vision LLM 거부 위험
"""

import base64
import json as _json

from playwright.async_api import Page, Response

from plugins.base import BaseScraper


def _flatten_json(obj, depth: int = 0, max_depth: int = 6) -> str:
    """
    JSON 객체를 LLM이 읽을 수 있는 평문으로 변환합니다.

    중첩 구조를 'key: value' 형태로 평탄화하며, 빈 값·null·숫자는 건너뜁니다.
    """
    if depth > max_depth:
        return ""
    if isinstance(obj, str):
        return obj.strip()
    if isinstance(obj, (int, float)):
        return ""   # 숫자 ID 등 노이즈 제외
    if isinstance(obj, bool) or obj is None:
        return ""
    if isinstance(obj, list):
        parts = [_flatten_json(item, depth + 1, max_depth) for item in obj]
        return "\n".join(p for p in parts if p)
    if isinstance(obj, dict):
        parts = []
        for key, val in obj.items():
            val_text = _flatten_json(val, depth + 1, max_depth)
            if not val_text:
                continue
            if depth < 3:
                parts.append(f"[{key}]\n{val_text}")
            else:
                parts.append(val_text)
        return "\n".join(parts)
    return ""


class JobkoreaScraper(BaseScraper):
    """잡코리아 전용 스크래퍼."""

    DOMAINS = ["jobkorea.co.kr"]
    PREFERS_BROWSER = True

    def __init__(self) -> None:
        super().__init__()
        self._captured: list[tuple[str, str]] = []  # (응답URL, 평문텍스트)
        self._captured_images: list[str] = []        # base64 data URL 목록

    # ─── BaseScraper 인터페이스 구현 ─────────────────────────────────────────

    async def setup(self, page: Page) -> None:
        """
        page.goto() 전에 네트워크 응답 인터셉터를 등록합니다.

        jobkorea.co.kr 도메인의 JSON 응답 중 500바이트 이상인 것만 캡처합니다.
        광고/트래킹 및 공통 코드 테이블은 URL 패턴으로 제외합니다.
        """
        _SKIP_PATTERNS = (
            "doubleclick", "googlesyndication", "googletagmanager",
            "facebook", "criteo", "moatads", "scorecardresearch",
            "/beacon", "/pixel", "/track", "/log", "/analytics",
            "/stat", "/event",
            "/jobs/api/codes/",     # 직종/지역/혜택 등 수십만자 룩업 테이블
        )

        async def on_response(response: Response) -> None:
            try:
                url = response.url
                if "jobkorea.co.kr" not in url:
                    return
                if any(skip in url.lower() for skip in _SKIP_PATTERNS):
                    return
                content_type = response.headers.get("content-type", "")
                if "json" not in content_type:
                    return
                body = await response.body()
                if len(body) < 500:
                    return
                data = _json.loads(body)
                text = _flatten_json(data)
                if len(text) > 100:
                    self._captured.append((url, text))
                    self.logger.debug("API 응답 캡처: %s (%d자)", url[:100], len(text))
            except Exception as e:
                self.logger.debug("응답 처리 오류 (무시): %s", e)

        page.on("response", on_response)
        self.logger.debug("잡코리아 API 인터셉터 등록 완료")

    async def before_extract(self, page: Page) -> None:
        """
        GI_Read_Comt_Ifrm iframe에서 콘텐츠를 추출합니다.

        React 하이드레이션을 기다린 뒤:
        - 텍스트 공고: detail-content 텍스트를 메인 DOM에 주입
        - 이미지 공고: detail-content 요소를 정밀 스크린샷으로 캡처
        """
        self.logger.info("잡코리아 GI_Read_Comt_Ifrm 하이드레이션 대기 중...")

        # GI_Read_Comt_Ifrm 프레임 찾기
        iframe_frame = None
        for frame in page.frames:
            if "GI_Read_Comt_Ifrm" in frame.url:
                iframe_frame = frame
                break

        if not iframe_frame:
            self.logger.warning("GI_Read_Comt_Ifrm 프레임을 찾을 수 없음")
            return

        # React 하이드레이션 대기:
        # React가 `invisible` 클래스를 제거하면 `#detail-content:not(.invisible)` 매칭됨
        # 최대 25초 대기 (SPA 초기화 + 하이드레이션 소요 시간)
        try:
            await iframe_frame.wait_for_selector(
                "#detail-content:not(.invisible)",
                timeout=25_000,
                state="attached",
            )
            self.logger.info("detail-content 가시화 확인 (하이드레이션 완료)")
        except Exception:
            self.logger.warning(
                "detail-content 가시화 타임아웃 — 현재 상태로 계속 진행"
            )

        # ─── 텍스트 추출 시도 ────────────────────────────────────────────────
        # textContent는 CSS visibility에 무관하게 모든 텍스트를 반환합니다.
        # (innerText는 visibility:hidden 요소를 건너뜁니다)
        try:
            content_text = await iframe_frame.evaluate("""
                () => {
                    const el = document.getElementById('detail-content');
                    return el ? el.textContent : '';
                }
            """)
            content_text = content_text.strip() if content_text else ""
        except Exception as e:
            self.logger.debug("detail-content textContent 실패: %s", e)
            content_text = ""

        self.logger.info("detail-content textContent: %d자", len(content_text))

        if len(content_text) > 30:
            # 텍스트 기반 공고 → 메인 DOM에 주입
            await page.evaluate(
                """(text) => {
                    const div = document.createElement('div');
                    div.id = '__jobkorea_detail__';
                    div.setAttribute('aria-hidden', 'true');
                    div.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;overflow:hidden;';
                    div.textContent = text;
                    document.body.appendChild(div);
                }""",
                content_text,
            )
            self.logger.info("텍스트 기반 공고: detail-content DOM 주입 완료")
            return

        # ─── 이미지 기반 공고: 정밀 스크린샷 ──────────────────────────────────
        # textContent가 짧으면 이미지 첨부파일로만 구성된 공고일 가능성이 높음.
        # 전체 iframe 스크린샷(상품 사진 등 포함) 대신 detail-content 요소만 캡처합니다.
        self.logger.info(
            "텍스트 부족(%d자) → detail-content 요소 정밀 스크린샷 시도", len(content_text)
        )
        try:
            detail_el = await iframe_frame.query_selector("#detail-content")
            if detail_el is None:
                self.logger.debug("detail-content 요소 없음 — 스크린샷 건너뜀")
                return

            screenshot = await detail_el.screenshot(type="jpeg", quality=90)
            if len(screenshot) > 5_000:  # 5KB 이상이면 의미 있는 콘텐츠로 간주
                b64 = base64.b64encode(screenshot).decode()
                self._captured_images.append(f"data:image/jpeg;base64,{b64}")
                self.logger.info(
                    "detail-content 정밀 스크린샷 캡처 완료 (%d bytes)", len(screenshot)
                )
            else:
                self.logger.debug("스크린샷 너무 작음 (%d bytes) — 건너뜀", len(screenshot))
        except Exception as e:
            self.logger.debug("detail-content 스크린샷 실패: %s", e)

        # ─── API 인터셉트 데이터 보완 주입 ──────────────────────────────────
        if self._captured:
            import re
            page_url = page.url
            job_ids = set(re.findall(r"\b\d{5,}\b", page_url))
            id_matched = [
                (resp_url, text)
                for resp_url, text in self._captured
                if job_ids and any(jid in resp_url for jid in job_ids)
            ]
            selected = id_matched if id_matched else []
            if selected:
                api_text = "\n\n---\n\n".join(text for _, text in selected)
                await page.evaluate(
                    """(text) => {
                        const div = document.createElement('div');
                        div.id = '__jobkorea_api__';
                        div.setAttribute('aria-hidden', 'true');
                        div.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;overflow:hidden;';
                        div.textContent = text;
                        document.body.appendChild(div);
                    }""",
                    api_text,
                )
                self.logger.info("API 인터셉트 데이터 DOM 주입: %d자", len(api_text))

    def get_captured_images(self) -> list[str]:
        """
        before_extract에서 캡처한 detail-content 정밀 스크린샷을 반환합니다.
        파이프라인이 iframe 전체 스크린샷보다 우선 사용합니다.
        """
        return list(self._captured_images)
