"""
LangChain ChatOpenAI 기반 LLM 호출.
"""

import json

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from app import config

_llm: ChatOpenAI | None = None

_SYSTEM_PROMPT = """
당신은 이력서 분석 전문가입니다.
주어진 이력서 텍스트(또는 이력서의 일부)에서 다음 정보를 JSON 형식으로 추출하세요.
텍스트가 이력서의 일부일 수 있으므로, 보이는 정보만 추출하고 없는 정보는 빈 값으로 두세요.

응답 형식 (반드시 유효한 JSON만 반환):
{
  "skills": ["기술1", "기술2", ...],
  "keywords": ["키워드1", "키워드2", ...],
  "career_summary": "이 부분에서 파악된 경력 요약 (없으면 빈 문자열)",
  "total_experience_years": 숫자 또는 null,
  "job_titles": ["직함1", "직함2", ...],
  "career_level": "junior | mid | senior | lead | executive | null",
  "industry_domains": ["핀테크", "이커머스", ...],
  "educations": [{"school": "학교명", "major": "전공", "degree": "학위", "graduated_year": 연도 또는 null}],
  "certifications": ["자격증명1", "자격증명2", ...],
  "languages": [{"language": "영어", "level": "비즈니스급"}],
  "projects": [{"name": "프로젝트명", "description": "간략 설명", "skills": ["기술1"]}]
}
"""


def _get_llm() -> ChatOpenAI:
  global _llm
  if _llm is None:
    _llm = ChatOpenAI(
      model=config.OPENAI_LLM_MODEL,
      openai_api_key=config.OPENAI_API_KEY,
      temperature=0,
      model_kwargs={"response_format": {"type": "json_object"}},
    )
  return _llm


def analyze_text_with_llm(text: str) -> tuple[dict, int, int]:
  """
  이력서 텍스트를 LLM으로 분석합니다.

  Returns:
    (parsed_data, prompt_tokens, total_tokens)
  """
  llm = _get_llm()
  response = llm.invoke([
    SystemMessage(content=_SYSTEM_PROMPT),
    HumanMessage(content=text),
  ])

  raw = response.content or "{}"
  parsed = json.loads(raw)

  usage = response.usage_metadata or {}
  prompt_tokens = usage.get("input_tokens", 0)
  total_tokens = usage.get("total_tokens", 0)

  return parsed, prompt_tokens, total_tokens
