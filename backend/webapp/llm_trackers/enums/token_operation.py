from django.db import models


class TokenOperation(models.TextChoices):
  """LLM API 기본 연산 종류."""

  COMPLETION = "completion", "텍스트 생성 (Chat Completion)"
  EMBEDDING = "embedding", "임베딩 생성"
