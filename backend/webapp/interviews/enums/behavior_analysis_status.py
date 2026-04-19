from django.db import models


class BehaviorAnalysisStatus(models.TextChoices):
  PENDING = "pending"
  PROCESSING = "processing"
  COMPLETED = "completed"
  FAILED = "failed"
