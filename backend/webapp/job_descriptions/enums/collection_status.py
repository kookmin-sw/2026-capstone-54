from django.db import models


class CollectionStatus(models.TextChoices):
  PENDING = "pending", "수집 진행 예정"
  IN_PROGRESS = "in_progress", "수집 중"
  DONE = "done", "수집 완료"
  ERROR = "error", "수집 실패"
