from django.db import models


class ResumeType(models.TextChoices):
  TEXT = "text", "자유 텍스트"
  FILE = "file", "파일 업로드"
  STRUCTURED = "structured", "정규화 입력"
