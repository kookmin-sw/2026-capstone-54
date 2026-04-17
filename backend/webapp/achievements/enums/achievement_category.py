from django.db import models


class AchievementCategory(models.TextChoices):
  STREAK = "streak", "스트릭"
  ACTIVITY = "activity", "활동"
  PROFILE = "profile", "프로필"
  INTERVIEW = "interview", "인터뷰"
  OTHER = "other", "기타"
