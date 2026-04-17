from django.db import models


class ApplicationStatus(models.TextChoices):
  PLANNED = "planned", "지원 예정"
  SAVED = "saved", "관심 저장"
  APPLIED = "applied", "지원 완료"
