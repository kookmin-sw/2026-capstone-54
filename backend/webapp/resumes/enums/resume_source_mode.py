from django.db import models


class ResumeSourceMode(models.TextChoices):
  """이력서가 처음 생성된 방식."""

  FILE = "file", "파일 업로드"
  TEXT = "text", "텍스트 입력"
  STRUCTURED = "structured", "구조화 폼 직접 작성"
