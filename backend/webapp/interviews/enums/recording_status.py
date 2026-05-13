from django.db import models


class RecordingStatus(models.TextChoices):
  INITIATED = "initiated"
  UPLOADING = "uploading"
  COMPLETED = "completed"
  PROCESSING = "processing"
  READY = "ready"
  FAILED = "failed"
  ABANDONED = "abandoned"
