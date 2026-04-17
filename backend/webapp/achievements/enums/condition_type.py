from django.db import models


class AchievementConditionType(models.TextChoices):
  RULE_GROUP = "rule_group", "규칙 그룹"
