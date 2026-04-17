from achievements.validators import validate_condition_payload
from django.core.exceptions import ValidationError
from django.test import TestCase


class ConditionPayloadValidatorTests(TestCase):

  def test_accepts_valid_group_payload(self):
    payload = {
      "type": "group",
      "logic": "AND",
      "rules": [{
        "type": "metric_threshold",
        "metric_key": "interview.total_count",
        "operator": ">=",
        "target": 1,
      }],
    }
    validate_condition_payload(payload)

  def test_rejects_unknown_rule_type(self):
    payload = {"type": "unknown"}
    with self.assertRaises(ValidationError):
      validate_condition_payload(payload)

  def test_rejects_unsupported_schema_version(self):
    payload = {
      "type": "group",
      "logic": "AND",
      "rules": [{
        "type": "metric_threshold",
        "metric_key": "interview.total_count",
        "operator": ">=",
        "target": 1,
      }],
    }
    with self.assertRaises(ValidationError):
      validate_condition_payload(payload, schema_version=2)
