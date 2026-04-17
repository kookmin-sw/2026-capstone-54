import structlog
from django.core.cache import cache

logger = structlog.get_logger(__name__)

ALERT_WINDOW_SECONDS = 300
ALERT_MIN_EVALUATIONS = 30
ALERT_FAILURE_RATE_THRESHOLD = 0.2
_ALERT_KEY_PREFIX = "achievement:evaluation:stats:"
_ALERT_COOLDOWN_PREFIX = "achievement:evaluation:alert:cooldown:"


def record_evaluation_outcome(*, trigger_key: str | None, is_failure: bool):
  """평가 성공/실패를 집계하고 실패율 급증 시 경고 로그를 남긴다."""
  key_suffix = trigger_key or "unknown"
  total_key = f"{_ALERT_KEY_PREFIX}{key_suffix}:total"
  failed_key = f"{_ALERT_KEY_PREFIX}{key_suffix}:failed"
  cooldown_key = f"{_ALERT_COOLDOWN_PREFIX}{key_suffix}"

  _incr_with_ttl(total_key, ALERT_WINDOW_SECONDS)
  if is_failure:
    _incr_with_ttl(failed_key, ALERT_WINDOW_SECONDS)

  total = _safe_get_int(total_key)
  failed = _safe_get_int(failed_key)
  if total < ALERT_MIN_EVALUATIONS:
    return

  failure_rate = failed / total if total else 0
  if failure_rate < ALERT_FAILURE_RATE_THRESHOLD:
    return

  if not cache.add(cooldown_key, 1, timeout=ALERT_WINDOW_SECONDS):
    return

  logger.warning(
    "achievement_evaluation_error_spike",
    extra={
      "event": "achievement_evaluation_error_spike",
      "trigger_key": key_suffix,
      "evaluation_result": False,
      "failure_reason": "high_failure_rate",
      "window_seconds": ALERT_WINDOW_SECONDS,
      "total_evaluations": total,
      "failed_evaluations": failed,
      "failure_rate": round(failure_rate, 4),
    },
  )


def _incr_with_ttl(key: str, ttl: int):
  cache.add(key, 0, timeout=ttl)
  try:
    cache.incr(key)
  except ValueError:
    cache.set(key, 1, timeout=ttl)


def _safe_get_int(key: str) -> int:
  value = cache.get(key) or 0
  try:
    return int(value)
  except (TypeError, ValueError):
    return 0
