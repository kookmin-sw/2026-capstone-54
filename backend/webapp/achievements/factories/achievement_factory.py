import factory
from achievements.models import Achievement
from factory.django import DjangoModelFactory


class AchievementFactory(DjangoModelFactory):

  class Meta:
    model = Achievement

  code = factory.Sequence(lambda n: f"achievement_{n}")
  name = factory.Sequence(lambda n: f"도전과제 {n}")
  description = "테스트 도전과제"
  category = Achievement.Category.OTHER
  condition_type = Achievement.ConditionType.RULE_GROUP
  condition_schema_version = 1
  condition_payload = {
    "type": "group",
    "logic": "AND",
    "rules": [{
      "type": "metric_threshold",
      "metric_key": "interview.total_count",
      "operator": ">=",
      "target": 1,
    }],
  }
  reward_payload = {
    "type": "ticket",
    "amount": 1,
  }
  is_active = True
  starts_at = None
  ends_at = None
