"""면접 연습/실전 모드 열거형."""

from django.db.models import TextChoices


class InterviewPracticeMode(TextChoices):
  PRACTICE = "practice", "연습 모드"
  REAL = "real", "실전 모드"
