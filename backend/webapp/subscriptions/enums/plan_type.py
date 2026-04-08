from django.db import models


class PlanType(models.TextChoices):
  FREE = "free", "무료"
  PRO = "pro", "Pro"
