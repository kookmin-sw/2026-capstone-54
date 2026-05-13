from django.db import models


class SubscriptionStatus(models.TextChoices):
  PENDING = "pending", "시작 전"
  ACTIVE = "active", "활성"
  EXPIRED = "expired", "만료됨"
