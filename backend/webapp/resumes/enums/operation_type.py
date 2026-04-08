from django.db import models


class OperationType(models.TextChoices):
  EMBED = "embed", "임베딩"
  SEARCH = "search", "검색 쿼리 임베딩"
  ANALYZE = "analyze", "LLM 분석"
