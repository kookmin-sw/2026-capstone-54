"""
공통 LLM 클라이언트 팩토리.

Django settings를 기반으로 LangChain LLM 인스턴스를 생성한다.

settings.OPENAI_BASE_URL 가 비어 있으면 OpenAI 직통 (로컬 개발 기본값),
설정되어 있으면 LLM Gateway (LiteLLM Proxy) 경유 (운영 K3s 기본값).
"""

from __future__ import annotations

from django.conf import settings
from langchain_openai import ChatOpenAI


def get_llm(model_name: str | None = None, temperature: float = 0.7) -> ChatOpenAI:
  """Django settings 기반 LangChain ChatOpenAI 인스턴스를 반환한다.

    Args:
        model_name: 사용할 모델명. None이면 settings.OPENAI_MODEL 사용.
        temperature: 생성 온도 (0.0 ~ 1.0).

    Returns:
        ChatOpenAI 인스턴스.
    """
  model = model_name or getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")
  base_url = getattr(settings, "OPENAI_BASE_URL", "") or None
  return ChatOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=base_url,
    model=model,
    temperature=temperature,
  )
