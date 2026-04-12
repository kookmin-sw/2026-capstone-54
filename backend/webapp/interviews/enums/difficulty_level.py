from django.db import models


class InterviewDifficultyLevel(models.TextChoices):
  FRIENDLY = "friendly", "친근한 면접관"
  NORMAL = "normal", "일반 면접관"
  PRESSURE = "pressure", "압박 면접관"
