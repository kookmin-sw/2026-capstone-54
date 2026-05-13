from django.db import models


class RecordingMediaType(models.TextChoices):
  VIDEO = "video"
  AUDIO = "audio"
