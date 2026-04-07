"""
pipeline.py 내부 함수들의 I/O 스키마.

대상 함수:
    pipeline.run()                  전체 파이프라인
    pipeline._try_direct_request()  1단계 HTTP 수집
    pipeline._try_playwright()      2단계 Playwright 수집
"""

from pydantic import BaseModel, Field
from schemas.job_posting import JobPostingSchema


# ──────────────────────────────────────────────
# pipeline.run()
# ──────────────────────────────────────────────

class PipelineInput(BaseModel):
    """
    pipeline.run() 입력 스키마.

    browser 인스턴스는 Playwright 객체라 직렬화 불가 → url만 포함합니다.
    """

    url: str = Field(description="스크래핑할 채용공고 URL")


class PipelineOutput(JobPostingSchema):
    """
    pipeline.run() 출력 스키마.

    JobPostingSchema를 그대로 상속합니다.
    내부적으로 extractors.schema.JobPosting dataclass를 거쳐 반환되며,
    최종적으로 이 모델과 동일한 필드 구조를 가집니다.
    """


# ──────────────────────────────────────────────
# pipeline._try_direct_request()
# ──────────────────────────────────────────────

class DirectRequestResult(BaseModel):
    """
    pipeline._try_direct_request() 출력 스키마.

    함수 원형:
        async def _try_direct_request(url: str) -> str | None

    html이 None이면 봇 차단 또는 요청 실패를 의미합니다.
    """

    html: str | None = Field(
        default=None,
        description="수집된 HTML 문자열. 봇 차단/요청 실패 시 None.",
    )


# ──────────────────────────────────────────────
# pipeline._try_playwright()
# ──────────────────────────────────────────────

class PlaywrightCollectResult(BaseModel):
    """
    pipeline._try_playwright() 출력 스키마.

    함수 원형:
        async def _try_playwright(url, plugin, browser)
            -> tuple[str|None, list[str], list[str], list[str], bool]

    반환 튜플을 필드로 풀어서 표현합니다.
    """

    html: str | None = Field(
        default=None,
        description="메인 페이지 HTML. Playwright 오류 시 None.",
    )
    iframe_htmls: list[str] = Field(
        default_factory=list,
        description="수집된 iframe HTML 목록 (이미지 URL 추출에 사용).",
    )
    iframe_texts: list[str] = Field(
        default_factory=list,
        description="iframe DOM에서 추출한 innerText 목록 (LLM 입력에 사용).",
    )
    image_urls: list[str] = Field(
        default_factory=list,
        description=(
            "수집된 이미지 URL 목록. "
            "플러그인 캡처(data:) > iframe 직접URL(httpx 다운로드) > iframe 스크린샷(data:) 순으로 구성."
        ),
    )
    iframe_is_same_domain: bool = Field(
        default=False,
        description=(
            "True: 동일 도메인 + 공고 ID 매칭 iframe (잡코리아 등 공고 본문 전용). "
            "False: 외부 도메인 iframe (메인 텍스트 부족 시에만 병합)."
        ),
    )