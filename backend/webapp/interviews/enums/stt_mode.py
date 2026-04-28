from django.db import models


class InterviewSttMode(models.TextChoices):
  BROWSER = "browser"
  BACKEND = "backend"
