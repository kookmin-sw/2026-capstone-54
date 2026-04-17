from unittest.mock import patch
from uuid import uuid4

from achievements.services.evaluation_alert_service import (
  ALERT_FAILURE_RATE_THRESHOLD,
  ALERT_MIN_EVALUATIONS,
  record_evaluation_outcome,
)
from django.test import TestCase, override_settings

LOCMEM_CACHE = {
  "default": {
    "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    "LOCATION": "evaluation-alert-test",
  }
}


@override_settings(CACHES=LOCMEM_CACHE)
class EvaluationAlertServiceTests(TestCase):

  @patch("achievements.services.evaluation_alert_service.logger")
  def test_logs_warning_when_failure_rate_spikes(self, mock_logger):
    """실패율이 임계치를 초과하면 경고 로그를 남긴다."""
    trigger_key = f"test.trigger.{uuid4()}"
    failures = int(ALERT_MIN_EVALUATIONS * ALERT_FAILURE_RATE_THRESHOLD) + 1
    successes = ALERT_MIN_EVALUATIONS - failures

    for _ in range(failures):
      record_evaluation_outcome(trigger_key=trigger_key, is_failure=True)
    for _ in range(successes):
      record_evaluation_outcome(trigger_key=trigger_key, is_failure=False)

    self.assertTrue(mock_logger.warning.called)

  @patch("achievements.services.evaluation_alert_service.logger")
  def test_does_not_log_warning_when_failure_rate_is_low(self, mock_logger):
    """실패율이 낮으면 경고 로그를 남기지 않는다."""
    trigger_key = f"test.trigger.low.{uuid4()}"

    for _ in range(ALERT_MIN_EVALUATIONS):
      record_evaluation_outcome(trigger_key=trigger_key, is_failure=False)

    mock_logger.warning.assert_not_called()
