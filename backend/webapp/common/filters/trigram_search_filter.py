from django.contrib.postgres.search import TrigramSimilarity
from django.db import models
from django.db.models.functions import Greatest
from rest_framework.filters import SearchFilter


class TrigramSearchFilter(SearchFilter):
  """
    DRF SearchFilter 서브클래스. PostgreSQL TrigramSimilarity 기반 유사도 검색.

    - 표준 ?search= 쿼리 파라미터 사용
    - drf-spectacular가 SearchFilter로 자동 인식하여 문서화
    - pg_trgm PostgreSQL 익스텐션 필요

    뷰 설정 옵션:
        search_fields: list[str]     검색 대상 필드 (필수)
        trigram_threshold: float     유사도 임계값 (기본값: 0.1)
        trigram_limit: int | None    검색 결과 최대 개수 (기본값: None)
    """

  def filter_queryset(self, request, queryset, view):
    search_fields = self.get_search_fields(view, request)
    search_terms = self.get_search_terms(request)

    if not search_fields or not search_terms:
      return queryset

    search_query = " ".join(search_terms)
    threshold = getattr(view, "trigram_threshold", 0.1)
    limit = getattr(view, "trigram_limit", None)

    similarity_annotations = {
      f"_similarity_{i}": TrigramSimilarity(field.lstrip("^=$@"), search_query)
      for i, field in enumerate(search_fields)
    }
    queryset = queryset.annotate(**similarity_annotations)

    if len(similarity_annotations) == 1:
      similarity_expr = models.F(list(similarity_annotations.keys())[0])
    else:
      similarity_expr = Greatest(*similarity_annotations.keys())

    queryset = (queryset.annotate(similarity=similarity_expr).filter(similarity__gt=threshold).order_by("-similarity"))

    if limit is not None:
      queryset = queryset[:limit]

    return queryset
