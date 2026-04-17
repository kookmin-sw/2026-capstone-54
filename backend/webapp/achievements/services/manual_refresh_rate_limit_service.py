import structlog
from django.core.cache import cache
from django.utils import timezone

REFRESH_TTL_SECONDS = 300
REFRESH_KEY_PREFIX = "achievement:refresh:user:"
logger = structlog.get_logger(__name__)


def check_and_mark_manual_refresh(user_id: int) -> tuple[bool, int]:
  """수동 refresh 제한을 검사하고 허용 시 5분 키를 기록한다."""
  key = f"{REFRESH_KEY_PREFIX}{user_id}"
  now_ts = int(timezone.now().timestamp())
  try:
    is_marked = cache.add(key, now_ts, timeout=REFRESH_TTL_SECONDS)
    if is_marked:
      return True, 0

    last_ts = cache.get(key)
    if last_ts is None:
      return False, REFRESH_TTL_SECONDS
    elapsed = max(0, now_ts - int(last_ts))
    retry_after = max(0, REFRESH_TTL_SECONDS - elapsed)
    return False, retry_after
  except Exception as exc:  # noqa: BLE001
    logger.warning(
      "achievement_refresh_rate_limit_fallback_open",
      extra={
        "event": "achievement_refresh_rate_limit_fallback_open",
        "user_id": user_id,
        "failure_reason": str(exc),
      },
    )
    # Fallback-open: Redis/cache 오류 시 사용자 요청 자체는 허용한다.
    return True, 0
