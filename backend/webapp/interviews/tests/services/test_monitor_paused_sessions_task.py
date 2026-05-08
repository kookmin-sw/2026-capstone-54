"""MonitorPausedSessionsTask 동작 검증."""

from django.test import TestCase
from django.utils import timezone
from interviews.constants import (
  FOLLOWUP_ANCHOR_COUNT,
  MAX_FOLLOWUP_PER_ANCHOR,
)
from interviews.enums import InterviewExchangeType, InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from interviews.tasks.monitor_paused_sessions_task import MonitorPausedSessionsTask
from users.factories import UserFactory


def _create_completion_eligible_followup_turns(session) -> None:
  """FOLLOWUP 세션이 is_completion_eligible() 를 만족하도록 모든 턴 생성."""
  for anchor_idx in range(FOLLOWUP_ANCHOR_COUNT):
    anchor = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      answer=f"앵커 답변 {anchor_idx + 1}",
      turn_number=anchor_idx + 1,
      followup_order=None,
    )
    for followup_idx in range(MAX_FOLLOWUP_PER_ANCHOR):
      InterviewTurnFactory(
        interview_session=session,
        turn_type=InterviewExchangeType.FOLLOWUP,
        answer=f"꼬리 답변 {anchor_idx + 1}-{followup_idx + 1}",
        turn_number=anchor_idx + 1,
        followup_order=followup_idx + 1,
        anchor_turn=anchor,
      )


class MonitorPausedSessionsTaskTests(TestCase):
  """heartbeat timeout 감지 + 장기 PAUSED 자동 종료 검증."""

  def test_marks_in_progress_with_old_heartbeat_as_paused(self):
    """last_heartbeat_at 이 120 초 이상 오래된 IN_PROGRESS 세션은 PAUSED 로 전환된다."""
    user = UserFactory()
    session = InterviewSessionFactory(
      user=user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=5,
    )
    session.last_heartbeat_at = timezone.now() - timezone.timedelta(seconds=180)
    session.save(update_fields=["last_heartbeat_at"])

    result = MonitorPausedSessionsTask().run()

    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.PAUSED)
    self.assertEqual(session.pause_reason, "heartbeat_timeout")
    self.assertEqual(result["heartbeat_timeout_paused"], 1)

  def test_does_not_pause_recent_heartbeat(self):
    """heartbeat 가 최근(120 초 이내)인 IN_PROGRESS 세션은 영향받지 않는다."""
    user = UserFactory()
    session = InterviewSessionFactory(
      user=user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    session.last_heartbeat_at = timezone.now() - timezone.timedelta(seconds=30)
    session.save(update_fields=["last_heartbeat_at"])

    result = MonitorPausedSessionsTask().run()

    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)
    self.assertEqual(result["heartbeat_timeout_paused"], 0)

  def test_does_not_pause_session_without_heartbeat(self):
    """last_heartbeat_at 이 None 인 IN_PROGRESS 세션은 영향받지 않는다 (heartbeat 송신 전)."""
    user = UserFactory()
    InterviewSessionFactory(
      user=user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )

    result = MonitorPausedSessionsTask().run()

    self.assertEqual(result["heartbeat_timeout_paused"], 0)

  def test_finishes_long_paused_session_when_completion_eligible(self):
    """30 분 이상 PAUSED 인 세션이 is_completion_eligible() 만족 시 COMPLETED 로 전환된다."""
    user = UserFactory()
    session = InterviewSessionFactory(
      user=user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=FOLLOWUP_ANCHOR_COUNT * (1 + MAX_FOLLOWUP_PER_ANCHOR),
    )
    _create_completion_eligible_followup_turns(session)
    session.mark_paused(reason="heartbeat_timeout")
    session.refresh_from_db()
    session.paused_at = timezone.now() - timezone.timedelta(minutes=45)
    session.save(update_fields=["paused_at"])

    result = MonitorPausedSessionsTask().run()

    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.COMPLETED)
    self.assertEqual(result["long_paused_auto_finished"], 1)

  def test_does_not_finish_long_paused_session_when_not_eligible(self):
    """30 분 이상 PAUSED 라도 상수 수식 기준 턴 수가 부족하면 COMPLETED 로 전환되지 않는다."""
    user = UserFactory()
    session = InterviewSessionFactory(
      user=user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=2,
    )
    InterviewTurnFactory(interview_session=session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=session, answer="답변2", turn_number=2)
    session.mark_paused(reason="heartbeat_timeout")
    session.refresh_from_db()
    session.paused_at = timezone.now() - timezone.timedelta(minutes=45)
    session.save(update_fields=["paused_at"])

    result = MonitorPausedSessionsTask().run()

    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.PAUSED)
    self.assertEqual(result["long_paused_auto_finished"], 0)

  def test_does_not_finish_recent_paused_session(self):
    """짧게 PAUSED 인 세션 (30 분 미만) 은 영향받지 않는다."""
    user = UserFactory()
    session = InterviewSessionFactory(
      user=user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    session.mark_paused(reason="manual_pause")

    result = MonitorPausedSessionsTask().run()

    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.PAUSED)
    self.assertEqual(result["long_paused_auto_finished"], 0)
