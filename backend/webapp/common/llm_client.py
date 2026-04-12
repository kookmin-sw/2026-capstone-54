"""
공통 LLM 클라이언트 팩토리.

Django settings를 기반으로 LangChain LLM 인스턴스를 생성한다.
이후 OpenAI 외 다른 LLM으로 교체 시 이 파일만 수정하면 된다.
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
  return ChatOpenAI(
    api_key=settings.OPENAI_API_KEY,
    model=model,
    temperature=temperature,
  )
