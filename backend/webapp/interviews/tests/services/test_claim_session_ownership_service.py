"""ClaimSessionOwnershipService 테스트."""

import hashlib

from common.exceptions import ConflictException
from django.core.cache import cache
from django.test import TestCase, override_settings
from interviews.factories import InterviewSessionFactory
from interviews.services import ClaimSessionOwnershipService
from users.factories import UserFactory


@override_settings(
  CACHES={
    "default": {
      "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
      "LOCATION": "test-claim-session-ownership",
    }
  }
)
class ClaimSessionOwnershipServiceTests(TestCase):
  """ClaimSessionOwnershipService.perform 동작 검증."""

  def setUp(self):
    cache.clear()
    self.user = UserFactory()
    self.session = InterviewSessionFactory(user=self.user)

  def tearDown(self):
    cache.clear()

  def test_returns_owner_token_and_version(self):
    """정상 발급 시 owner_token 과 owner_version 을 반환한다."""
    result = ClaimSessionOwnershipService(user=self.user, session=self.session).perform()

    self.assertIn("owner_token", result)
    self.assertIn("owner_version", result)
    self.assertIsInstance(result["owner_token"], str)
    self.assertGreater(len(result["owner_token"]), 0)

  def test_increments_owner_version_on_claim(self):
    """claim 성공 시 owner_version 이 0 에서 1 로 증가한다."""
    self.assertEqual(self.session.owner_version, 0)

    result = ClaimSessionOwnershipService(user=self.user, session=self.session).perform()

    self.session.refresh_from_db()
    self.assertEqual(self.session.owner_version, 1)
    self.assertEqual(result["owner_version"], 1)

  def test_persists_token_hash_to_db(self):
    """반환된 token 의 sha256 해시가 DB owner_token_hash 와 일치한다."""
    result = ClaimSessionOwnershipService(user=self.user, session=self.session).perform()

    self.session.refresh_from_db()
    expected_hash = hashlib.sha256(result["owner_token"].encode()).hexdigest()
    self.assertEqual(self.session.owner_token_hash, expected_hash)

  def test_stores_token_in_redis(self):
    """발급 후 Redis 에 owner_token 이 저장된다."""
    result = ClaimSessionOwnershipService(user=self.user, session=self.session).perform()

    cache_key = f"interview_session_owner:{self.session.uuid}"
    self.assertEqual(cache.get(cache_key), result["owner_token"])

  def test_overwrites_stale_owner_token_for_same_user(self):
    """이전에 발급된 stale owner_token 이 남아있어도 같은 사용자 재진입 시 새 토큰으로 덮어쓴다."""
    cache_key = f"interview_session_owner:{self.session.uuid}"
    cache.set(cache_key, "stale-token", timeout=7200)

    result = ClaimSessionOwnershipService(user=self.user, session=self.session).perform()

    self.assertNotEqual(result["owner_token"], "stale-token")
    self.assertEqual(cache.get(cache_key), result["owner_token"])

  def test_raises_conflict_when_user_is_not_owner(self):
    """세션 user 가 아닌 다른 사용자의 claim 은 SESSION_OWNER_REQUIRED 로 거부한다."""
    other_user = UserFactory()

    with self.assertRaises(ConflictException) as ctx:
      ClaimSessionOwnershipService(user=other_user, session=self.session).perform()

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")

  def test_raises_conflict_when_user_is_none(self):
    """user 가 None 이면 SESSION_OWNER_REQUIRED 로 거부한다."""
    with self.assertRaises(ConflictException) as ctx:
      ClaimSessionOwnershipService(user=None, session=self.session).perform()

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")
