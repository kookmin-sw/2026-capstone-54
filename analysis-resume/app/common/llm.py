"""LangChain ChatOpenAI 기반 LLM 호출.

LLM 출력은 `ParsedResumeData` Pydantic 스키마로 강제(structured output) 한다.
응답 토큰 수는 `include_raw=True` 로 동시에 얻은 원본 AIMessage 의 usage_metadata 에서 추출한다.
"""

from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app import config
from app.schemas.parsed_data import ParsedResumeData

_llm = None  # structured-output 바인딩된 Runnable 캐시

_SYSTEM_PROMPT = """
당신은 모든 직군(IT/개발, 마케팅, 디자인, 영업, 재무/회계, 인사, 기획, CS 등) 의
이력서를 정확히 분석하는 전문가입니다. 주어진 이력서 텍스트(또는 일부) 를 읽고
`ParsedResumeData` Pydantic 스키마에 1:1 로 매핑하여 반환하세요.

=============================================================
## 출력 스키마 (필드별 의미)

{
  "basic_info": {
    "name":     "이력서 소유자 이름 (없으면 null)",
    "email":    "이메일 주소 (없으면 null)",
    "phone":    "연락처 (없으면 null)",
    "location": "거주지 또는 근무 희망지 (없으면 null)"
  },

  "summary": "한국어 1-2 문장 경력 요약. 본문에서 드러난 직무 방향성과 강점을 짧게.",

  "skills": {
    "technical": ["하드 스킬 / 직무 전문 역량. 프로그래밍 언어·프레임워크·카피라이팅·재무분석·SEO 등 직군 무관"],
    "soft":      ["커뮤니케이션, 리더십, 협업, 문제해결 등 소프트 스킬"],
    "tools":     ["사용 도구·플랫폼·SaaS. Jira/Figma/GA4/SAP/Photoshop/Docker/Salesforce 등"],
    "languages": ["외국어 능력 목록 (예: \\"영어\\", \\"일본어\\")"]
  },

  "experiences": [
    {
      "company":          "회사명",
      "role":             "직함/직무",
      "period":           "근무 기간 (예: 2020.03 - 2023.06)",
      "responsibilities": ["담당했던 주요 업무/책임 bullet"],
      "highlights":       ["수치/지표 포함 주요 성과 bullet (예: 매출 30% 증대, QPS 3배 개선)"]
    }
  ],

  "educations": [
    {"school": "학교명", "degree": "학사/석사/박사", "major": "전공", "period": "재학 기간"}
  ],

  "certifications": [
    {"name": "자격증명", "issuer": "발급 기관", "date": "취득일/연월"}
  ],

  "awards": [
    {"name": "수상 이름", "year": "수상 연도", "organization": "주최/수여 기관", "description": "수상 상세 설명"}
  ],

  "projects": [
    {
      "name":        "프로젝트명",
      "role":        "프로젝트 내 역할",
      "period":      "진행 기간",
      "description": "프로젝트 개요 / 기여 내용",
      "tech_stack":  ["사용 도구/기술 목록 — snake_case 키"]
    }
  ],

  "languages_spoken": [
    {"language": "영어", "level": "비즈니스급 / TOEIC 900 / 원어민 등 자유 서술"}
  ],

  "total_experience_years": "총 경력의 연(year) 부분 정수. 모호하면 null. 예: 3년 6개월 → 3",
  "total_experience_months": "총 경력의 월(month) 부분 정수 0-11. 모호하면 null. 예: 3년 6개월 → 6",

  "industry_domains": ["경험한 산업 도메인 태그. 예: \\"핀테크\\", \\"이커머스\\", \\"헬스케어\\", \\"B2B SaaS\\""],

  "keywords": ["이력서 전반에서 가장 의미 있는 자유 키워드 상위 5-15개"],

  "job_category": "이력서의 주된 직군 라벨. 반드시 다음 한국어 라벨 중 하나만 사용:
    IT/개발, 마케팅, 디자인, 영업, 재무/회계, 인사, 기획, CS, 디지털 마케팅, 기타"
}

=============================================================
## 준수 사항

1. 반드시 위 스키마를 그대로 따라 JSON 을 구성합니다. 스키마에 없는 필드는 생성하지 마세요.
2. `skills` 는 반드시 4개 하위 배열(technical/soft/tools/languages) 로 분류합니다.
   flat 배열(["Python", "Django"]) 로 내지 마세요.
3. `projects[*].tech_stack` 은 snake_case 키를 사용합니다. (`techStack` 금지)
4. 텍스트에 없는 정보는 빈 문자열 "" 또는 빈 배열 [] 또는 null 을 사용하며, 추측/창작하지 않습니다.
5. `summary` 는 한국어 1-2 문장으로 간결하게 작성합니다. 문단 쓰지 않기.
6. `job_category` 는 상단 10개 라벨 중 하나만 사용하며, 새 라벨을 만들지 마세요.
7. `experiences[*].highlights` 는 수치/지표가 포함된 성과 문장이 있으면 우선적으로 포함합니다.
8. `industry_domains` 는 "B2B", "B2C" 처럼 너무 일반적인 분류 대신 구체적 산업 이름을 쓰세요.
9. 청크가 이력서의 "일부" 일 수 있으므로, 보이지 않는 섹션은 빈 값으로 두고 다른 청크가 채우도록 합니다.
10. 이전 버전에 있던 `career_level` 같은 IT 편향 필드는 더 이상 사용하지 않습니다. 포함하지 마세요.
"""


def _get_structured_llm():
  """structured-output 이 바인딩된 Runnable 을 반환(캐시)."""
  global _llm
  if _llm is not None:
    return _llm

  base = ChatOpenAI(
    model=config.OPENAI_LLM_MODEL,
    openai_api_key=config.OPENAI_API_KEY,
    base_url=config.OPENAI_BASE_URL,
    temperature=0,
  )
  # include_raw=True: 호출 결과가 {"raw": AIMessage, "parsed": ParsedResumeData, "parsing_error": ...}
  # 형태로 반환되어 usage_metadata 도 함께 얻을 수 있다.
  _llm = base.with_structured_output(ParsedResumeData, include_raw=True)
  return _llm


def analyze_text_with_llm(text: str) -> tuple[ParsedResumeData, int, int]:
  """이력서 텍스트를 LLM 으로 분석해 Pydantic 인스턴스로 반환한다.

  Returns:
    (parsed, prompt_tokens, total_tokens)
  """
  llm = _get_structured_llm()
  result = llm.invoke([
    SystemMessage(content=_SYSTEM_PROMPT),
    HumanMessage(content=text),
  ])

  parsed: ParsedResumeData | None = result.get("parsed") if isinstance(result, dict) else None
  raw_msg = result.get("raw") if isinstance(result, dict) else None

  if parsed is None:
    parsed = ParsedResumeData()

  usage = getattr(raw_msg, "usage_metadata", None) or {}
  prompt_tokens = int(usage.get("input_tokens", 0) or 0)
  total_tokens = int(usage.get("total_tokens", 0) or 0)

  return parsed, prompt_tokens, total_tokens
