from django.db import models


class InterviewDifficultyLevel(models.TextChoices):
  FRIENDLY = "friendly", "친절"
  NORMAL = "normal", "보통"
  PRESSURE = "pressure", "압박"
