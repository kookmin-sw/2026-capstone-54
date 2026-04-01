"""임베딩 엔진 모듈."""

from langchain_core.embeddings import Embeddings


class EmbeddingEngine:

  def __init__(self, embeddings: Embeddings | None = None, use_bedrock: bool = False, use_openai: bool = False):
    self.embeddings = embeddings or self._create_default(use_bedrock, use_openai)

  def _create_default(self, use_bedrock: bool, use_openai: bool) -> Embeddings:
    if use_openai:
      from langchain_openai import OpenAIEmbeddings
      return OpenAIEmbeddings(model="text-embedding-3-small")
    if use_bedrock:
      try:
        from langchain_aws import BedrockEmbeddings
        return BedrockEmbeddings()
      except Exception as e:
        raise ConnectionError(f"Bedrock 연결 실패: {e}") from e
    from langchain_community.embeddings import FakeEmbeddings
    return FakeEmbeddings(size=384)

  def get_embeddings(self) -> Embeddings:
    return self.embeddings
