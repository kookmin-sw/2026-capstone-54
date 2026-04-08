from django.db import models


class QuestionSource(models.TextChoices):
  RESUME = "resume", "이력서"
  JOB_DESCRIPTION = "job_description", "채용공고"
  UNKNOWN = "unknown", "미분류"
