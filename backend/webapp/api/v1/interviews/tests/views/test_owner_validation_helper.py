"""require_session_owner_from_request 헬퍼 테스트."""

import hashlib

from api.v1.interviews.views._owner_validation import require_session_owner_from_request
from common.exceptions import ConflictException
from django.core.cache import cache
from django.test import TestCase, override_settings
from interviews.factories import InterviewSessionFactory
from users.factories import UserFactory


class _FakeRequest:

  def __init__(self, headers):
    self.headers = headers


@override_settings(
  CACHES={
    "default": {
      "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
      "LOCATION": "test-owner-validation-helper",
    }
  }
)
class RequireSessionOwnerFromRequestTests(TestCase):
  """헤더 추출 + validate_session_owner 위임 동작 검증."""

  def setUp(self):
    cache.clear()
    self.user = UserFactory()
    self.session = InterviewSessionFactory(user=self.user)
    self.token = "valid-token"
    self.session.owner_token_hash = hashlib.sha256(self.token.encode()).hexdigest()
    self.session.owner_version = 1
    self.session.save(update_fields=["owner_token_hash", "owner_version"])

  def tearDown(self):
    cache.clear()

  def test_passes_when_headers_match_db(self):
    """헤더 token+version 이 DB hash+version 과 일치하면 예외 없이 통과한다."""
    request = _FakeRequest({
      "X-Session-Owner-Token": self.token,
      "X-Session-Owner-Version": "1",
    })

    require_session_owner_from_request(request, self.session)

  def test_raises_when_version_header_missing(self):
    """X-Session-Owner-Version 헤더가 없으면 SESSION_OWNER_REQUIRED 를 raise 한다."""
    request = _FakeRequest({"X-Session-Owner-Token": self.token})

    with self.assertRaises(ConflictException) as ctx:
      require_session_owner_from_request(request, self.session)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")

  def test_raises_when_version_header_not_integer(self):
    """X-Session-Owner-Version 헤더가 정수로 파싱 불가하면 SESSION_OWNER_REQUIRED."""
    request = _FakeRequest({
      "X-Session-Owner-Token": self.token,
      "X-Session-Owner-Version": "abc",
    })

    with self.assertRaises(ConflictException) as ctx:
      require_session_owner_from_request(request, self.session)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")

  def test_raises_when_token_header_missing(self):
    """X-Session-Owner-Token 헤더가 없으면 SESSION_OWNER_REQUIRED 를 raise 한다."""
    request = _FakeRequest({"X-Session-Owner-Version": "1"})

    with self.assertRaises(ConflictException) as ctx:
      require_session_owner_from_request(request, self.session)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")

  def test_raises_when_token_mismatch(self):
    """헤더 token 이 DB hash 와 일치하지 않으면 SESSION_OWNER_CHANGED."""
    request = _FakeRequest({
      "X-Session-Owner-Token": "wrong-token",
      "X-Session-Owner-Version": "1",
    })

    with self.assertRaises(ConflictException) as ctx:
      require_session_owner_from_request(request, self.session)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_CHANGED")

  def test_raises_when_version_mismatch(self):
    """헤더 version 이 DB owner_version 과 다르면 SESSION_OWNER_CHANGED."""
    request = _FakeRequest({
      "X-Session-Owner-Token": self.token,
      "X-Session-Owner-Version": "99",
    })

    with self.assertRaises(ConflictException) as ctx:
      require_session_owner_from_request(request, self.session)

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_CHANGED")
