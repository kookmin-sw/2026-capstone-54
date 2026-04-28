"""TakeoverInterviewSessionService 테스트."""

import hashlib
from unittest.mock import patch

from common.exceptions import ConflictException
from django.core.cache import cache
from django.test import TestCase, override_settings
from interviews.enums import RecordingStatus
from interviews.factories import InterviewRecordingFactory, InterviewSessionFactory
from interviews.models import InterviewRecording
from interviews.services import TakeoverInterviewSessionService
from users.factories import UserFactory


@override_settings(
  CACHES={
    "default": {
      "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
      "LOCATION": "test-takeover-interview-session",
    }
  }
)
class TakeoverInterviewSessionServiceTests(TestCase):
  """TakeoverInterviewSessionService.perform 동작 검증."""

  def setUp(self):
    cache.clear()
    self.user = UserFactory()
    self.session = InterviewSessionFactory(user=self.user)

  def tearDown(self):
    cache.clear()

  def _create_recording(self, status: str = RecordingStatus.UPLOADING) -> InterviewRecording:
    return InterviewRecordingFactory(interview_session=self.session, status=status)

  def test_returns_owner_token_version_and_ws_ticket(self):
    """takeover 결과로 owner_token, owner_version, ws_ticket 을 반환한다."""
    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      result = TakeoverInterviewSessionService(user=self.user, session=self.session).perform()

    self.assertIn("owner_token", result)
    self.assertIn("owner_version", result)
    self.assertIn("ws_ticket", result)

  def test_increments_owner_version(self):
    """owner_version 이 1 증가한다."""
    self.assertEqual(self.session.owner_version, 0)

    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      result = TakeoverInterviewSessionService(user=self.user, session=self.session).perform()

    self.session.refresh_from_db()
    self.assertEqual(self.session.owner_version, 1)
    self.assertEqual(result["owner_version"], 1)

  def test_persists_token_hash_to_db(self):
    """반환된 owner_token 의 sha256 해시가 DB owner_token_hash 와 일치한다."""
    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      result = TakeoverInterviewSessionService(user=self.user, session=self.session).perform()

    self.session.refresh_from_db()
    expected_hash = hashlib.sha256(result["owner_token"].encode()).hexdigest()
    self.assertEqual(self.session.owner_token_hash, expected_hash)

  def test_overwrites_owner_token_in_redis(self):
    """기존 Redis owner key 가 있어도 새 토큰으로 덮어쓴다."""
    cache_key = f"interview_session_owner:{self.session.uuid}"
    cache.set(cache_key, "stale-token", timeout=7200)

    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      result = TakeoverInterviewSessionService(user=self.user, session=self.session).perform()

    self.assertEqual(cache.get(cache_key), result["owner_token"])

  def test_issues_ws_ticket_to_redis(self):
    """발급된 ws_ticket 이 Redis 에 user_id 로 저장된다."""
    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      result = TakeoverInterviewSessionService(user=self.user, session=self.session).perform()

    self.assertEqual(cache.get(f"ws_ticket:{result['ws_ticket']}"), self.user.pk)

  def test_marks_uploading_recording_as_abandoned(self):
    """UPLOADING 상태의 녹화는 ABANDONED 로 전환된다."""
    recording = self._create_recording(status=RecordingStatus.UPLOADING)

    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      TakeoverInterviewSessionService(user=self.user, session=self.session).perform()

    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.ABANDONED)

  def test_marks_initiated_recording_as_abandoned(self):
    """INITIATED 상태의 녹화도 ABANDONED 로 전환된다."""
    recording = self._create_recording(status=RecordingStatus.INITIATED)

    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      TakeoverInterviewSessionService(user=self.user, session=self.session).perform()

    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.ABANDONED)

  def test_does_not_modify_completed_recording(self):
    """COMPLETED 상태의 녹화는 영향받지 않는다."""
    recording = self._create_recording(status=RecordingStatus.COMPLETED)

    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit"):
      TakeoverInterviewSessionService(user=self.user, session=self.session).perform()

    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.COMPLETED)

  def test_schedules_s3_abort_and_group_send_on_commit(self):
    """S3 abort 와 group_send 가 transaction.on_commit 으로 등록된다."""
    self._create_recording(status=RecordingStatus.UPLOADING)

    with patch("interviews.services.takeover_interview_session_service.transaction.on_commit") as mock_on_commit:
      TakeoverInterviewSessionService(user=self.user, session=self.session).perform()

    self.assertEqual(mock_on_commit.call_count, 2)

  def test_raises_owner_required_when_user_does_not_match(self):
    """다른 사용자가 takeover 시 SESSION_OWNER_REQUIRED 로 거부한다."""
    other_user = UserFactory()

    with self.assertRaises(ConflictException) as ctx:
      TakeoverInterviewSessionService(user=other_user, session=self.session).perform()

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")

  def test_raises_owner_required_when_user_is_none(self):
    """user 가 None 이면 SESSION_OWNER_REQUIRED 로 거부한다."""
    with self.assertRaises(ConflictException) as ctx:
      TakeoverInterviewSessionService(user=None, session=self.session).perform()

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")
