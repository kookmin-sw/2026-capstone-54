"""
이력서 임베딩 유사도 검색 서비스.

키워드를 임베딩하여 pgvector 코사인 유사도로
ResumeEmbedding 레코드를 검색한다.
"""

import structlog
from common.services import BaseQueryService
from common.utils import embed_query
from django.conf import settings
from pgvector.django import CosineDistance
from resumes.enums import AnalysisStatus, OperationType
from resumes.models import ResumeEmbedding, ResumeTokenUsage

logger = structlog.getLogger(__name__)


class SearchResumeEmbeddingService(BaseQueryService):
  """
  pgvector 코사인 유사도로 ResumeEmbedding을 검색한다.

  필수 kwargs:
    keyword (str): 검색 키워드 또는 문장
    resume_uuid (str): 검색 대상 이력서 UUID

  선택 kwargs:
    top_k (int): 최대 결과 수. 기본 10.
    similarity_threshold (float): 유사도 임계값 (0.0~1.0). 기본 0.3.
    record_usage (bool): 토큰 사용량 기록 여부. 기본 True.
  """

  required_value_kwargs = ["keyword", "resume_uuid"]

  DEFAULT_TOP_K = 10
  DEFAULT_THRESHOLD = 0.3

  def execute(self) -> list[dict]:
    """키워드를 임베딩하고 유사도 검색을 실행한다."""
    keyword = self.kwargs["keyword"]
    resume_uuid = self.kwargs["resume_uuid"]
    top_k = self.kwargs.get("top_k", self.DEFAULT_TOP_K)
    threshold = self.kwargs.get("similarity_threshold", self.DEFAULT_THRESHOLD)
    record_usage = self.kwargs.get("record_usage", True)

    query_vector, search_tokens = embed_query(keyword)

    if record_usage:
      self._record_token_usage(search_tokens, resume_uuid)

    embeddings = self._query_embeddings(query_vector, resume_uuid, top_k)
    return self._build_results(embeddings, threshold)

  def _record_token_usage(self, tokens: int, resume_uuid: str) -> None:
    """검색 쿼리의 토큰 사용량을 기록한다."""
    ResumeTokenUsage.objects.create(
      user_id=self.user.id,
      resume_id=resume_uuid,
      operation_type=OperationType.SEARCH,
      model_name=settings.OPENAI_EMBEDDING_MODEL,
      prompt_tokens=tokens,
      total_tokens=tokens,
    )

  def _query_embeddings(
    self,
    query_vector: list[float],
    resume_uuid: str,
    top_k: int,
  ) -> list:
    """코사인 유사도로 임베딩을 검색한다."""
    return list(
      ResumeEmbedding.objects.filter(
        user_id=self.user.id,
        resume_id=resume_uuid,
        embedding_vector__isnull=False,
        resume__deleted_at__isnull=True,
        resume__analysis_status=AnalysisStatus.COMPLETED,
      ).annotate(distance=CosineDistance("embedding_vector", query_vector)
                 ).order_by("distance").select_related("resume")[:top_k]
    )

  @staticmethod
  def _build_results(embeddings: list, threshold: float) -> list[dict]:
    """threshold를 적용하여 임베딩 단위 결과 목록을 반환한다."""
    results = []
    for emb in embeddings:
      if emb.distance is None or float(emb.distance) > 1 - threshold:
        continue
      results.append(
        {
          "embedding_uuid": str(emb.uuid),
          "resume_uuid": str(emb.resume_id),
          "title": emb.resume.title,
          "similarity": round(1 - float(emb.distance), 4),
          "context": emb.context,
          "chunk_type": emb.chunk_type,
          "chunk_index": emb.chunk_index,
        }
      )
    return results
