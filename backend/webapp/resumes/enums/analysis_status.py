from django.db import models


class AnalysisStatus(models.TextChoices):
  PENDING = "pending", "대기 중"
  PROCESSING = "processing", "처리 중"
  COMPLETED = "completed", "완료"
  FAILED = "failed", "실패"
