from datetime import timedelta

from achievements.factories import AchievementFactory
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone


class AchievementModelTests(TestCase):

  def test_validates_period_order(self):
    now = timezone.now()
    achievement = AchievementFactory.build(starts_at=now, ends_at=now - timedelta(days=1))
    with self.assertRaises(ValidationError):
      achievement.full_clean()

  def test_maps_schema_version_error_to_field(self):
    achievement = AchievementFactory.build(condition_schema_version=2)

    with self.assertRaises(ValidationError) as exc_info:
      achievement.full_clean()

    self.assertIn("condition_schema_version", exc_info.exception.message_dict)

  def test_maps_payload_validation_error_to_condition_payload_field(self):
    achievement = AchievementFactory.build(
      condition_payload={
        "type": "metric_threshold",
        "metric_key": "invalid.metric.key",
        "operator": ">=",
        "target": 1,
      }
    )

    with self.assertRaises(ValidationError) as exc_info:
      achievement.full_clean()

    self.assertIn("condition_payload", exc_info.exception.message_dict)
