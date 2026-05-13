from django.db import models


class TranscriptStatus(models.TextChoices):
  PENDING = "pending"
  PROCESSING = "processing"
  COMPLETED = "completed"
  FAILED = "failed"
