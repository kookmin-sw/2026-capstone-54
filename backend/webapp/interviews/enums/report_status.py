from django.db import models


class InterviewReportStatus(models.TextChoices):
  PENDING = "pending", "대기 중"
  GENERATING = "generating", "생성 중"
  COMPLETED = "completed", "완료"
  FAILED = "failed", "실패"
