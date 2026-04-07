"""
extractors/llm_extractor.py 함수들의 I/O 스키마.

대상 함수:
    clean_html_to_text()       HTML → 정제 텍스트
    extract_with_llm()         텍스트 → LLM 추출 결과
    extract_with_vision_llm()  이미지 → LLM Vision 추출 결과
"""

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# clean_html_to_text()
# ──────────────────────────────────────────────

class CleanHTMLInput(BaseModel):
    """
    clean_html_to_text() 입력 스키마.

    함수 원형:
        def clean_html_to_text(html: str) -> str
    """

    html: str = Field(description="정제할 원본 HTML 문자열")


class CleanHTMLOutput(BaseModel):
    """
    clean_html_to_text() 출력 스키마.

    script/style/nav/header/footer 등을 제거한 뒤
    LLM_MAX_TEXT_CHARS 이하로 잘린 순수 텍스트를 반환합니다.
    """

    text: str = Field(description="정제된 텍스트 (LLM 입력용)")


# ──────────────────────────────────────────────
# extract_with_llm() / extract_with_vision_llm() 공통 출력
# ──────────────────────────────────────────────

class LLMExtractOutput(BaseModel):
    """
    extract_with_llm() 및 extract_with_vision_llm() 공통 출력 스키마.

    GPT가 반환하는 JSON을 파싱한 결과이며,
    추출 실패 시 모든 필드가 빈 문자열("")입니다.
    """

    title: str = Field(default="", description="채용공고 제목")
    company: str = Field(default="", description="회사명")
    duties: str = Field(default="", description="담당업무")
    requirements: str = Field(default="", description="지원자격 / 필수조건")
    preferred: str = Field(default="", description="우대사항")
    work_type: str = Field(default="", description="고용형태")
    salary: str = Field(default="", description="급여 정보")
    location: str = Field(default="", description="근무지역")
    education: str = Field(default="", description="학력 조건")
    experience: str = Field(default="", description="경력 조건")


# ──────────────────────────────────────────────
# extract_with_llm()
# ──────────────────────────────────────────────

class LLMExtractInput(BaseModel):
    """
    extract_with_llm() 입력 스키마.

    함수 원형:
        async def extract_with_llm(text: str, url: str) -> dict
    """

    text: str = Field(description="clean_html_to_text()로 정제된 텍스트")
    url: str = Field(description="원본 채용공고 URL (로그 및 LLM 프롬프트용)")


# ──────────────────────────────────────────────
# extract_with_vision_llm()
# ──────────────────────────────────────────────

class VisionLLMExtractInput(BaseModel):
    """
    extract_with_vision_llm() 입력 스키마.

    함수 원형:
        async def extract_with_vision_llm(image_urls: list[str], url: str) -> dict

    image_urls는 최대 5개까지만 LLM에 전달됩니다 (토큰 비용 제한).
    data: URI (base64 인코딩) 또는 https:// URL 모두 허용됩니다.
    """

    image_urls: list[str] = Field(
        description=(
            "채용공고 이미지 URL 목록. "
            "data:image/jpeg;base64,... 형식(스크린샷) 또는 https:// URL 모두 허용. "
            "실제 LLM 호출 시 앞에서 최대 5개만 사용."
        ),
    )
    url: str = Field(description="원본 채용공고 URL (로그 및 LLM 프롬프트용)")