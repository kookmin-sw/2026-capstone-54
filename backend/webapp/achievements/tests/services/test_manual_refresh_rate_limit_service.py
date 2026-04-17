import time
from unittest.mock import patch

from achievements.services.manual_refresh_rate_limit_service import (
  REFRESH_KEY_PREFIX,
  check_and_mark_manual_refresh,
)
from django.core.cache import cache
from django.test import TestCase, override_settings

LOCMEM_CACHE = {
  "default": {
    "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    "LOCATION": "rate-limit-test",
  }
}


@override_settings(CACHES=LOCMEM_CACHE)
class ManualRefreshRateLimitServiceTests(TestCase):

  def setUp(self):
    self.user_id = int(time.time() * 1000000)
    cache.delete(f"{REFRESH_KEY_PREFIX}{self.user_id}")

  def test_allows_first_request_and_blocks_immediate_second_request(self):
    """첫 요청은 허용하고 즉시 두 번째 요청은 차단한다."""
    allowed, retry_after = check_and_mark_manual_refresh(user_id=self.user_id)
    self.assertTrue(allowed)
    self.assertEqual(retry_after, 0)

    allowed, retry_after = check_and_mark_manual_refresh(user_id=self.user_id)
    self.assertFalse(allowed)
    self.assertGreaterEqual(retry_after, 1)

  @patch("achievements.services.manual_refresh_rate_limit_service.cache.add", side_effect=Exception("cache-down"))
  def test_fallback_open_when_cache_add_fails(self, _mock_cache_add):
    """캐시 장애 시 fallback-open으로 허용한다."""
    allowed, retry_after = check_and_mark_manual_refresh(user_id=10000)
    self.assertTrue(allowed)
    self.assertEqual(retry_after, 0)
