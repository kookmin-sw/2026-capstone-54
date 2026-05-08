"""
LangChain OpenAIEmbeddings 기반 임베딩.

토큰 사용량 추적을 위해 콜백을 활용합니다.
"""

from langchain_openai import OpenAIEmbeddings

from app import config

_embeddings: OpenAIEmbeddings | None = None


def _get_embeddings() -> OpenAIEmbeddings:
  global _embeddings
  if _embeddings is None:
    _embeddings = OpenAIEmbeddings(
      model=config.OPENAI_EMBEDDING_MODEL,
      openai_api_key=config.OPENAI_API_KEY,
    )
  return _embeddings


def embed_texts(texts: list[str]) -> tuple[list[list[float]], int]:
  """
  텍스트 목록을 임베딩합니다.

  Returns:
    (embeddings, estimated_token_count)
  """
  embeddings_model = _get_embeddings()
  vectors = embeddings_model.embed_documents(texts)
  # LangChain OpenAIEmbeddings는 토큰 수를 직접 반환하지 않으므로
  # 대략적인 추정치 사용 (한국어 기준 글자당 ~0.5 토큰)
  estimated_tokens = sum(len(t) for t in texts)
  return vectors, estimated_tokens
