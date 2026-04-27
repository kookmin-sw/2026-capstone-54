from django.db import models


class TranscriptSource(models.TextChoices):
  BROWSER_STT = "browser_stt"
  BACKEND_STT = "backend_stt"
  NONE = "none"
