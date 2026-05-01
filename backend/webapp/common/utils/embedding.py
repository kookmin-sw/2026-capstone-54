"""
OpenAI 임베딩 유틸리티.

settings.OPENAI_API_KEY / settings.OPENAI_EMBEDDING_MODEL 을 사용하여
텍스트를 임베딩 벡터로 변환한다.

settings.OPENAI_BASE_URL 가 설정되면 LLM Gateway (LiteLLM) 경유, 아니면 OpenAI 직통.
"""

import openai
from django.conf import settings

_openai_client: openai.OpenAI | None = None


def _get_openai_client() -> openai.OpenAI:
  """OpenAI 클라이언트 싱글턴 (게이트웨이 또는 OpenAI 직통)."""
  global _openai_client
  if _openai_client is None:
    base_url = getattr(settings, "OPENAI_BASE_URL", "") or None
    _openai_client = openai.OpenAI(
      api_key=settings.OPENAI_API_KEY,
      base_url=base_url,
    )
  return _openai_client


def embed_query(query: str) -> tuple[list[float], int]:
  """
  쿼리 텍스트를 임베딩 벡터로 변환한다.

  Returns:
    (embedding_vector, total_tokens)
  """
  client = _get_openai_client()
  response = client.embeddings.create(
    input=query,
    model=settings.OPENAI_EMBEDDING_MODEL,
  )
  total_tokens = response.usage.total_tokens if response.usage else 0
  if not response.data:
    return [], total_tokens
  return response.data[0].embedding, total_tokens
