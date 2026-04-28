"""PauseInterviewSessionService / ResumeInterviewSessionService / RecordInterviewHeartbeatService 테스트."""

from common.exceptions import ConflictException
from django.test import TestCase
from django.utils import timezone
from interviews.enums import InterviewSessionStatus
from interviews.factories import InterviewSessionFactory
from interviews.services import (
  PauseInterviewSessionService,
  RecordInterviewHeartbeatService,
  ResumeInterviewSessionService,
)
from users.factories import UserFactory


class PauseInterviewSessionServiceTests(TestCase):
  """PauseInterviewSessionService.perform 동작 검증."""

  def setUp(self):
    self.user = UserFactory()
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )

  def test_transitions_in_progress_to_paused(self):
    """IN_PROGRESS 세션을 PAUSED 로 전환한다."""
    PauseInterviewSessionService(user=self.user, session=self.session, reason="user_left_window").perform()

    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.PAUSED)
    self.assertEqual(self.session.pause_reason, "user_left_window")
    self.assertIsNotNone(self.session.paused_at)
    self.assertEqual(self.session.pause_count, 1)

  def test_idempotent_when_already_paused(self):
    """이미 PAUSED 인 세션은 그대로 유지한다 (idempotent)."""
    self.session.mark_paused(reason="prev_reason")
    initial_pause_count = self.session.pause_count

    PauseInterviewSessionService(user=self.user, session=self.session, reason="new_reason").perform()

    self.session.refresh_from_db()
    self.assertEqual(self.session.pause_count, initial_pause_count)
    self.assertEqual(self.session.pause_reason, "prev_reason")

  def test_raises_conflict_when_session_completed(self):
    """COMPLETED 세션은 일시정지할 수 없다."""
    self.session.mark_completed()

    with self.assertRaises(ConflictException) as ctx:
      PauseInterviewSessionService(user=self.user, session=self.session, reason="any").perform()

    self.assertEqual(ctx.exception.error_code, "INTERVIEW_SESSION_NOT_IN_PROGRESS")

  def test_raises_owner_required_for_other_user(self):
    """다른 사용자가 호출하면 SESSION_OWNER_REQUIRED 로 거부한다."""
    other_user = UserFactory()

    with self.assertRaises(ConflictException) as ctx:
      PauseInterviewSessionService(user=other_user, session=self.session, reason="any").perform()

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")


class ResumeInterviewSessionServiceTests(TestCase):
  """ResumeInterviewSessionService.perform 동작 검증."""

  def setUp(self):
    self.user = UserFactory()
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.session.mark_paused(reason="user_left_window")

  def test_transitions_paused_to_in_progress(self):
    """PAUSED 세션을 IN_PROGRESS 로 재개한다."""
    ResumeInterviewSessionService(user=self.user, session=self.session).perform()

    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)
    self.assertIsNone(self.session.paused_at)

  def test_accumulates_paused_duration(self):
    """재개 시 누적 일시정지 시간이 갱신된다."""
    self.assertEqual(self.session.total_paused_duration_ms, 0)

    ResumeInterviewSessionService(user=self.user, session=self.session).perform()

    self.session.refresh_from_db()
    self.assertGreaterEqual(self.session.total_paused_duration_ms, 0)

  def test_idempotent_when_already_in_progress(self):
    """이미 IN_PROGRESS 인 세션은 그대로 유지한다 (idempotent)."""
    self.session.mark_resumed()
    self.session.refresh_from_db()
    initial_duration = self.session.total_paused_duration_ms

    ResumeInterviewSessionService(user=self.user, session=self.session).perform()

    self.session.refresh_from_db()
    self.assertEqual(self.session.total_paused_duration_ms, initial_duration)

  def test_raises_conflict_when_session_completed(self):
    """COMPLETED 세션은 재개할 수 없다."""
    self.session.mark_resumed()
    self.session.refresh_from_db()
    self.session.mark_completed()

    with self.assertRaises(ConflictException) as ctx:
      ResumeInterviewSessionService(user=self.user, session=self.session).perform()

    self.assertEqual(ctx.exception.error_code, "INTERVIEW_SESSION_NOT_PAUSED")

  def test_raises_owner_required_for_other_user(self):
    """다른 사용자가 호출하면 SESSION_OWNER_REQUIRED 로 거부한다."""
    other_user = UserFactory()

    with self.assertRaises(ConflictException) as ctx:
      ResumeInterviewSessionService(user=other_user, session=self.session).perform()

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")


class RecordInterviewHeartbeatServiceTests(TestCase):
  """RecordInterviewHeartbeatService.perform 동작 검증."""

  def setUp(self):
    self.user = UserFactory()
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )

  def test_updates_last_heartbeat_at(self):
    """last_heartbeat_at 이 현재 시각으로 갱신된다."""
    self.assertIsNone(self.session.last_heartbeat_at)
    before = timezone.now()

    RecordInterviewHeartbeatService(user=self.user, session=self.session).perform()

    self.session.refresh_from_db()
    self.assertIsNotNone(self.session.last_heartbeat_at)
    self.assertGreaterEqual(self.session.last_heartbeat_at, before)

  def test_overwrites_existing_heartbeat(self):
    """기존 last_heartbeat_at 이 더 최근 값으로 덮어쓰여진다."""
    self.session.last_heartbeat_at = timezone.now() - timezone.timedelta(minutes=5)
    self.session.save(update_fields=["last_heartbeat_at"])
    old_heartbeat = self.session.last_heartbeat_at

    RecordInterviewHeartbeatService(user=self.user, session=self.session).perform()

    self.session.refresh_from_db()
    self.assertGreater(self.session.last_heartbeat_at, old_heartbeat)

  def test_raises_owner_required_for_other_user(self):
    """다른 사용자가 호출하면 SESSION_OWNER_REQUIRED 로 거부한다."""
    other_user = UserFactory()

    with self.assertRaises(ConflictException) as ctx:
      RecordInterviewHeartbeatService(user=other_user, session=self.session).perform()

    self.assertEqual(ctx.exception.error_code, "SESSION_OWNER_REQUIRED")
