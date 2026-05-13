"""validate_session_owner 헬퍼 테스트."""

import hashlib
from unittest.mock import patch

from common.exceptions import ConflictException
from django.core.cache import cache
from django.test import TestCase, override_settings
from interviews.factories import InterviewSessionFactory
from interviews.services import validate_session_owner
from users.factories import UserFactory


@override_settings(
  CACHES={
    "default": {
      "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
      "LOCATION": "test-validate-session-owner",
    }
  }
)
class ValidateSessionOwnerTests(TestCase):
  """Redis 정상 경로 + DB fallback 경로 + 인자 누락 케이스 검증."""

  def setUp(self):
    cache.clear()
    self.user = UserFactory()
    self.session = InterviewSessionFactory(user=self.user)
    self.token = "valid-owner-token"
    self.token_hash = hashlib.sha256(self.token.encode()).hexdigest()
    self.session.owner_token_hash = self.token_hash
    self.session.owner_version = 1
    self.session.save(update_fields=["owner_token_hash", "owner_version"])
    self.cache_key = f"interview_session_owner:{self.session.uuid}"

  def tearDown(self):
    cache.clear()

  def test_passes_when_redis_token_and_version_match(self):
    """Redis 토큰 일치 + version 일치이면 예외 없이 통과한다."""
    cache.set(self.cache_key, self.token, timeout=7200)

    validate_session_owner(self.session, self.token, 1)

  def test_raises_owner_required_when_token_missing(self):
    """owner_token 이 빈 문자열이면 SESSION_OWNER_REQUIRED 를 raise 한다."""
    with self.assertRaises(ConflictException) as ctx:
      validate_session_owner(self.session, "", 1)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")

  def test_raises_owner_required_when_version_is_none(self):
    """owner_version 이 None 이면 SESSION_OWNER_REQUIRED 를 raise 한다."""
    with self.assertRaises(ConflictException) as ctx:
      validate_session_owner(self.session, self.token, None)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")

  def test_raises_owner_changed_when_redis_token_mismatch(self):
    """Redis 에 다른 토큰이 저장되어 있으면 SESSION_OWNER_CHANGED 로 거부한다."""
    cache.set(self.cache_key, "different-token", timeout=7200)

    with self.assertRaises(ConflictException) as ctx:
      validate_session_owner(self.session, self.token, 1)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_CHANGED")

  def test_falls_back_to_db_hash_when_redis_empty(self):
    """Redis 키가 없을 때 DB owner_token_hash 비교로 통과한다."""
    cache.delete(self.cache_key)

    validate_session_owner(self.session, self.token, 1)

  def test_db_fallback_raises_owner_changed_on_hash_mismatch(self):
    """Redis 키가 없고 DB hash 도 일치하지 않으면 SESSION_OWNER_CHANGED 로 거부한다."""
    cache.delete(self.cache_key)

    with self.assertRaises(ConflictException) as ctx:
      validate_session_owner(self.session, "wrong-token", 1)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_CHANGED")

  def test_raises_owner_changed_when_version_mismatch(self):
    """token 은 일치하지만 owner_version 이 다르면 SESSION_OWNER_CHANGED 로 거부한다."""
    cache.set(self.cache_key, self.token, timeout=7200)

    with self.assertRaises(ConflictException) as ctx:
      validate_session_owner(self.session, self.token, 99)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_CHANGED")

  def test_falls_back_to_db_when_redis_raises(self):
    """Redis cache.get 이 예외를 던지면 DB hash fallback 으로 동작한다."""
    with patch("interviews.services._ownership_validation.cache.get", side_effect=ConnectionError):
      validate_session_owner(self.session, self.token, 1)
