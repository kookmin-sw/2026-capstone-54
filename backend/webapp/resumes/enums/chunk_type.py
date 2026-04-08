from django.db import models


class ChunkType(models.TextChoices):
  TEXT = "text", "텍스트 청크"
  KEYWORD = "keyword", "키워드 요약"
  SKILL = "skill", "기술 스택"
  CAREER = "career", "경력 요약"
