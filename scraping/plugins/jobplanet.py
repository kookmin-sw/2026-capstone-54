"""
잡플래닛(jobplanet.co.kr) 전용 플러그인.

잡플래닛 채용 상세 페이지는 실제 공고 내용(수행업무/지원자격/우대사항)을
m.jobkorea.co.kr 도메인의 iframe(GIReadDetailContentBlind)에서 렌더링합니다.

파이프라인의 외부 도메인 iframe 병합 조건:
  - 메인 페이지 텍스트 < 1000자일 때만 병합
  - 잡플래닛은 내비게이션·랭킹 등으로 메인 텍스트가 항상 1000자를 초과 → 병합 불가

전략:
  1. before_extract에서 m.jobkorea.co.kr iframe 프레임 직접 접근
  2. iframe 내 본문 텍스트 추출
  3. 메인 DOM에 숨김 div로 주입 → 파이프라인이 자동으로 LLM 입력에 포함
"""

from playwright.async_api import Page

from plugins.base import BaseScraper


class JobplanetScraper(BaseScraper):
    """잡플래닛 전용 스크래퍼."""

    DOMAINS = ["jobplanet.co.kr"]
    PREFERS_BROWSER = True

    async def before_extract(self, page: Page) -> None:
        """
        m.jobkorea.co.kr iframe에서 공고 본문을 추출해 메인 DOM에 주입합니다.

        파이프라인의 외부 iframe 병합 임계값(1000자)을 우회하기 위해
        플러그인 레벨에서 직접 주입합니다.
        """
        self.logger.info("잡플래닛 jobkorea iframe 대기 중...")

        # jobkorea 임베드 iframe 로드 대기 (페이지 로드 후 동적 삽입됨)
        try:
            await page.wait_for_selector(
                'iframe[src*="jobkorea"]',
                timeout=15_000,
            )
        except Exception:
            self.logger.warning("jobkorea iframe 미감지 — 현재 상태로 계속")
            return

        # 프레임 목록에서 jobkorea 프레임 찾기
        jk_frame = None
        for _ in range(10):  # 프레임 등록까지 최대 3초 대기
            for frame in page.frames:
                if "jobkorea" in frame.url and "GIReadDetailContentBlind" in frame.url:
                    jk_frame = frame
                    break
            if jk_frame:
                break
            await page.wait_for_timeout(300)

        if not jk_frame:
            self.logger.warning("GIReadDetailContentBlind 프레임 미등록 — 건너뜀")
            return

        self.logger.info("jobkorea iframe 발견: %s", jk_frame.url[:100])

        # iframe 완전 로드 대기
        try:
            await jk_frame.wait_for_load_state("networkidle", timeout=10_000)
        except Exception:
            pass

        # 본문 텍스트 추출
        try:
            content_text = await jk_frame.inner_text("body")
            content_text = content_text.strip() if content_text else ""
        except Exception as e:
            self.logger.debug("iframe innerText 실패: %s", e)
            content_text = ""

        self.logger.info("jobkorea iframe 텍스트: %d자", len(content_text))

        if len(content_text) < 30:
            self.logger.warning("iframe 텍스트 너무 짧음 (%d자) — 주입 건너뜀", len(content_text))
            return

        # 메인 DOM에 숨김 div로 주입 (파이프라인이 HTML 수집 시 자동 포함)
        await page.evaluate(
            """(text) => {
                const div = document.createElement('div');
                div.id = '__jobplanet_detail__';
                div.setAttribute('aria-hidden', 'true');
                div.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;overflow:hidden;';
                div.textContent = text;
                document.body.appendChild(div);
            }""",
            content_text,
        )
        self.logger.info("jobkorea iframe 텍스트 메인 DOM 주입 완료 (%d자)", len(content_text))
