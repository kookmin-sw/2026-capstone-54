from django.db import models


class InterviewSessionStatus(models.TextChoices):
  IN_PROGRESS = "in_progress", "진행 중"
  COMPLETED = "completed", "완료"
