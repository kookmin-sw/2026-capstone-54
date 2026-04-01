"""
LLM 기반 채용 정보 추출 모듈.

HTML을 정제한 뒤 LangChain + GPT로 구조화된 채용 정보를 추출합니다.

전처리 전략 (최소화):
  1. <script>, <style> 등 절대 채용 정보가 없는 태그만 제거
  2. 페이지 수준 <nav>, <header>, <footer>, <aside> 제거
  3. body 전체 텍스트 추출 — 영역 좁히기 없음 (사이트 구조에 무관하게 동작)
  4. 연속 공백/빈 줄 정리
  5. LLM_MAX_TEXT_CHARS 이하로 자름
"""

import json
import re

from bs4 import BeautifulSoup
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_VISION_MODEL, LLM_MAX_TEXT_CHARS
from utils.logger import get_logger

logger = get_logger(__name__)

# 항상 안전하게 제거 가능한 태그 (절대로 채용 정보를 담지 않음)
_SAFE_REMOVE_TAGS = [
    "script", "style", "noscript",
    "iframe", "svg",
    "input", "select", "textarea",
]

# 페이지 레벨에서만 제거할 태그
# (HTML5에서 header/footer/aside/nav는 article 안에도 사용 가능하므로
#  body 직접 자식인 경우만 제거)
_PAGE_LEVEL_REMOVE_TAGS = ["header", "footer", "aside", "nav"]

_SYSTEM_PROMPT = """\
당신은 채용 공고에서 특정 섹션을 찾아 해당 내용을 그대로 복사하는 도구입니다.
주어진 텍스트 또는 이미지를 분석하여 아래 JSON 형식으로 응답하세요.
JSON 외의 다른 텍스트는 절대 출력하지 마세요.

{
  "title": "채용 공고 제목",
  "company": "회사명",
  "duties": "담당 업무 내용 — '담당업무', '주요업무', '하는 일', 'responsibilities' 등의 섹션",
  "requirements": "지원 필수 자격 조건 — '지원자격', '자격요건', '필수조건', '자격사항', 'requirements' 등의 섹션. 하나의 섹션에 자격사항과 우대사항이 함께 있으면 자격사항만 이 필드에 넣으세요.",
  "preferred": "우대 사항 — '우대사항', '우대조건', 'preferred' 등의 섹션. 하나의 섹션에 자격사항과 우대사항이 함께 있으면 우대사항만 이 필드에 넣으세요.",
  "work_type": "고용 형태 (예: 정규직, 계약직, 인턴 등)",
  "salary": "급여 정보",
  "location": "근무 위치 / 근무지",
  "education": "학력 조건",
  "experience": "경력 조건"
}

절대 규칙:
- duties, requirements, preferred 필드는 원문에서 해당 섹션의 텍스트를 단 한 글자도 수정, 요약, 재작성하지 말고 있는 그대로 복사하세요. 단, [헤더명] 형식의 구조 레이블(예: [담당업무], [자격 / 우대사항])은 출력에서 제외하세요.
- 여러 팀이나 항목이 나열된 경우 모두 포함하세요. 일부만 발췌하거나 합치지 마세요.
- 페이지에 '공통 자격요건', '지원 자격', '필수 조건' 등 requirements에 해당하는 섹션이 여러 곳에 있으면 모두 합쳐서 requirements 필드에 넣으세요.
- 각 필드에 해당하는 정보가 없으면 빈 문자열("")로 채우세요.
- 원문 텍스트의 언어(한국어/영어)를 그대로 유지하세요.
- 불필요한 마크다운, 코드블록 없이 순수 JSON만 출력하세요.
"""


def _table_to_text(table) -> str:
    """
    <table> 요소를 열 헤더가 보존된 텍스트로 변환합니다.

    일반 get_text()는 모든 셀을 한 덩어리로 합쳐 열 구분이 사라집니다.
    이 함수는 각 행을 "헤더: 값" 형식으로 변환하여 LLM이
    담당업무/자격조건 등 열을 구분할 수 있게 합니다.
    """
    rows = table.find_all("tr")
    if not rows:
        return table.get_text(separator=" ").strip()

    # 첫 번째 행에서 헤더 추출
    headers = []
    first_row = rows[0]
    for cell in first_row.find_all(["th", "td"]):
        headers.append(cell.get_text(separator=" ").strip())

    lines = []
    for row in rows[1:]:
        cells = row.find_all(["th", "td"])
        for i, cell in enumerate(cells):
            cell_text = cell.get_text(separator="\n").strip()
            if not cell_text:
                continue
            if i < len(headers) and headers[i]:
                lines.append(f"[{headers[i]}]\n{cell_text}")
            else:
                lines.append(cell_text)

    return "\n".join(lines) if lines else table.get_text(separator=" ").strip()


def clean_html_to_text(html: str) -> str:
    """
    HTML에서 노이즈를 제거하고 텍스트를 추출합니다.

    전략: 전처리를 최소화하고 LLM이 직접 판단하도록 합니다.
      1. 코드/스타일 등 절대 채용 정보가 없는 태그만 제거
      2. 페이지 수준 네비게이션/헤더/푸터 제거
      3. body 전체 텍스트 추출 (영역 좁히기 없음)
      4. 공백 정리 + 길이 제한
    """
    soup = BeautifulSoup(html, "lxml")

    # 1단계: 절대 채용 정보를 담지 않는 태그 전체 제거
    for tag_name in _SAFE_REMOVE_TAGS:
        for el in soup.find_all(tag_name):
            el.decompose()

    # 2단계: 페이지 수준 nav/header/footer/aside 제거
    # body 직접 자식만 제거 (공고 본문 내부의 같은 태그는 유지)
    body = soup.find("body")
    if body:
        for tag_name in _PAGE_LEVEL_REMOVE_TAGS:
            for el in body.find_all(tag_name, recursive=False):
                el.decompose()

    # 3단계: body 전체를 대상으로 텍스트 추출
    # 특정 영역만 좁히지 않음 → 사이트 구조와 무관하게 일관성 있게 동작
    root = body or soup
    logger.debug("텍스트 추출 대상: body 전체 (원본 HTML: %d bytes)", len(html))

    # 테이블은 열 구조 보존 변환 (담당업무/자격조건 등 열 구분 유지)
    for table in root.find_all("table"):
        table_text = _table_to_text(table)
        table.replace_with(f"\n{table_text}\n")

    text = root.get_text(separator="\n")

    # 4단계: 공백 정리
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]           # 빈 줄 제거
    deduplicated = []
    prev = None
    for line in lines:
        if line != prev:                               # 연속 중복 줄 제거
            deduplicated.append(line)
            prev = line
    text = "\n".join(deduplicated)

    # 5단계: 최대 길이 제한 (줄 단위로 자름 — 문장 중간에서 끊기지 않도록)
    if len(text) > LLM_MAX_TEXT_CHARS:
        lines_to_keep = []
        total = 0
        for line in deduplicated:
            if total + len(line) + 1 > LLM_MAX_TEXT_CHARS:
                break
            lines_to_keep.append(line)
            total += len(line) + 1
        text = "\n".join(lines_to_keep)
        logger.debug("텍스트 길이 초과 → %d자로 자름 (원본 %d자)", len(text), sum(len(l) for l in deduplicated))

    logger.debug("HTML 정제 완료: %d자", len(text))
    return text


async def extract_with_llm(text: str, url: str) -> dict:
    """
    정제된 텍스트를 GPT에 전달하여 채용 정보를 구조화된 dict로 반환합니다.

    Args:
        text: clean_html_to_text()로 정제된 텍스트
        url:  로그용 원본 URL

    Returns:
        JobPosting 필드에 대응하는 dict
    """
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")

    llm = ChatOpenAI(
        model=OPENAI_MODEL,
        api_key=OPENAI_API_KEY,
        temperature=0,          # 일관된 JSON 출력을 위해 0
        max_retries=2,
    )

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=(
            f"다음은 아래 URL의 채용 공고 페이지에서 추출한 텍스트입니다.\n"
            f"URL: {url}\n\n"
            f"텍스트에 여러 채용 공고가 섞여 있을 수 있습니다. "
            f"반드시 위 URL에 해당하는 채용 공고 정보만 추출하고, "
            f"추천 공고나 다른 회사의 공고는 완전히 무시하세요.\n\n"
            f"{text}"
        )),
    ]

    logger.info("GPT 호출 중 (모델: %s, 텍스트: %d자) — %s", OPENAI_MODEL, len(text), url)
    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    # 코드블록 래핑 제거 (모델이 ```json ... ``` 형식으로 응답할 경우 대비)
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("GPT 응답 JSON 파싱 실패: %s\n응답 내용: %s", e, raw[:300])
        # 파싱 실패 시 빈 필드 반환 (파이프라인을 중단시키지 않음)
        data = {}

    return {
        "title": data.get("title", ""),
        "company": data.get("company", ""),
        "duties": data.get("duties", ""),
        "requirements": data.get("requirements", ""),
        "preferred": data.get("preferred", ""),
        "work_type": data.get("work_type", ""),
        "salary": data.get("salary", ""),
        "location": data.get("location", ""),
        "education": data.get("education", ""),
        "experience": data.get("experience", ""),
    }


def _parse_llm_response(raw: str) -> dict:
    """LLM 응답 문자열을 dict로 파싱합니다 (공통 로직)."""
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("GPT 응답 JSON 파싱 실패: %s\n응답 내용: %s", e, raw[:300])
        data = {}
    return {
        "title": data.get("title", ""),
        "company": data.get("company", ""),
        "duties": data.get("duties", ""),
        "requirements": data.get("requirements", ""),
        "preferred": data.get("preferred", ""),
        "work_type": data.get("work_type", ""),
        "salary": data.get("salary", ""),
        "location": data.get("location", ""),
        "education": data.get("education", ""),
        "experience": data.get("experience", ""),
    }


async def extract_with_vision_llm(image_urls: list[str], url: str) -> dict:
    """
    채용공고 이미지를 GPT-4o Vision에 전달하여 채용 정보를 추출합니다.

    텍스트 추출이 불가능한 이미지 기반 공고에 사용됩니다.

    Args:
        image_urls: 채용공고 이미지 URL 목록 (최대 5개 사용)
        url:        로그용 원본 페이지 URL
    """
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")

    llm = ChatOpenAI(
        model=OPENAI_VISION_MODEL,
        api_key=OPENAI_API_KEY,
        temperature=0,
        max_retries=2,
    )

    # 이미지는 최대 5개 (토큰 비용 제한)
    target_urls = image_urls[:5]

    content: list = [
        {
            "type": "text",
            "text": (
                f"아래 이미지는 다음 URL의 채용공고 페이지 캡처입니다.\n"
                f"URL: {url}\n\n"
                f"이미지에 보이는 채용 정보를 시스템 프롬프트의 JSON 형식으로 추출하세요. "
                f"이미지 안의 텍스트를 그대로 읽어서 JSON 필드에 채워주세요. "
                f"반드시 이 URL에 해당하는 채용공고 정보만 추출하고 "
                f"다른 공고나 광고는 무시하세요."
            ),
        }
    ]
    for img_url in target_urls:
        content.append({
            "type": "image_url",
            "image_url": {"url": img_url, "detail": "high"},
        })

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=content),
    ]

    logger.info(
        "GPT Vision 호출 중 (모델: %s, 이미지: %d개) — %s",
        OPENAI_VISION_MODEL, len(target_urls), url,
    )
    response = await llm.ainvoke(messages)
    return _parse_llm_response(response.content.strip())