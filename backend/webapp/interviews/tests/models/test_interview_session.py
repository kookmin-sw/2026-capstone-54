from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory


class InterviewSessionMarkCompletedTests(TestCase):
  """InterviewSession.mark_completed 테스트"""

  def _build_completed_session(self):
    session = InterviewSessionFactory(
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=2,
    )
    InterviewTurnFactory(interview_session=session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=session, answer="답변2", turn_number=2)
    return session

  def test_mark_completed_sets_status_to_completed(self):
    """mark_completed 호출 시 상태가 completed로 변경된다."""
    session = self._build_completed_session()
    session.mark_completed()
    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.COMPLETED)

  def test_mark_completed_persists_to_db(self):
    """mark_completed는 DB에 저장된다."""
    session = self._build_completed_session()
    session.mark_completed()
    from interviews.models import InterviewSession
    updated = InterviewSession.objects.get(pk=session.pk)
    self.assertEqual(updated.interview_session_status, InterviewSessionStatus.COMPLETED)

  def test_mark_completed_raises_when_not_started(self):
    """total_questions=0 인 세션 (시작되지 않음) 은 ValueError 로 거부된다."""
    session = InterviewSessionFactory(
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=0,
    )
    with self.assertRaises(ValueError):
      session.mark_completed()

  def test_mark_completed_raises_when_unanswered_turns_exist(self):
    """미답변 turn 이 남아있으면 ValueError 로 거부된다."""
    session = InterviewSessionFactory(
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=2,
    )
    InterviewTurnFactory(interview_session=session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=session, answer="", turn_number=2)
    with self.assertRaises(ValueError):
      session.mark_completed()

  def test_mark_completed_does_not_persist_when_invariant_fails(self):
    """invariant 위반 시 DB 상태가 변경되지 않는다."""
    session = InterviewSessionFactory(
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=0,
    )
    with self.assertRaises(ValueError):
      session.mark_completed()
    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)


class InterviewSessionIsCompletionEligibleTests(TestCase):
  """InterviewSession.is_completion_eligible 테스트"""

  def test_returns_false_when_total_questions_is_zero(self):
    """total_questions=0 인 세션은 종료 불가."""
    session = InterviewSessionFactory(total_questions=0)
    self.assertFalse(session.is_completion_eligible())

  def test_returns_false_when_unanswered_turns_exist(self):
    """미답변 turn 이 하나라도 있으면 종료 불가."""
    session = InterviewSessionFactory(total_questions=2)
    InterviewTurnFactory(interview_session=session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=session, answer="", turn_number=2)
    self.assertFalse(session.is_completion_eligible())

  def test_returns_true_when_all_turns_answered(self):
    """모든 turn 에 답변이 있고 시작된 세션은 종료 가능."""
    session = InterviewSessionFactory(total_questions=2)
    InterviewTurnFactory(interview_session=session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=session, answer="답변2", turn_number=2)
    self.assertTrue(session.is_completion_eligible())


class InterviewSessionStrTests(TestCase):
  """InterviewSession.__str__ 테스트"""

  def test_str_contains_pk(self):
    """__str__은 세션 PK를 포함한다."""
    session = InterviewSessionFactory()
    result = str(session)
    self.assertIn(str(session.pk), result)

  def test_str_contains_status_display(self):
    """__str__은 상태 표시 문자열을 포함한다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    result = str(session)
    self.assertIn("진행 중", result)

  def test_str_completed_status_display(self):
    """__str__은 completed 상태의 표시 문자열을 포함한다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.COMPLETED)
    result = str(session)
    self.assertIn("완료", result)


class InterviewSessionDefaultValuesTests(TestCase):
  """InterviewSession 기본값 테스트"""

  def test_default_status_is_in_progress(self):
    """생성 시 기본 상태는 in_progress이다."""
    session = InterviewSessionFactory()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_default_total_questions_is_zero(self):
    """생성 시 total_questions 기본값은 0이다."""
    session = InterviewSessionFactory(total_questions=0)
    self.assertEqual(session.total_questions, 0)

  def test_uuid_is_pk(self):
    """UUID가 PK로 사용된다."""
    session = InterviewSessionFactory()
    self.assertEqual(session.pk, session.uuid)

  def test_full_process_session_type(self):
    """full_process 타입 세션을 생성할 수 있다."""
    session = InterviewSessionFactory(interview_session_type=InterviewSessionType.FULL_PROCESS)
    self.assertEqual(session.interview_session_type, InterviewSessionType.FULL_PROCESS)


class InterviewSessionMarkPausedTests(TestCase):
  """InterviewSession.mark_paused 테스트"""

  def test_mark_paused_changes_status_to_paused(self):
    """mark_paused 호출 시 상태가 PAUSED로 변경된다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    session.mark_paused("일시정지 테스트")
    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.PAUSED)

  def test_mark_paused_sets_paused_at_to_now(self):
    """mark_paused는 paused_at을 현재 시간으로 설정한다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    before_call = timezone.now()
    session.mark_paused("사유")
    session.refresh_from_db()
    self.assertIsNotNone(session.paused_at)
    self.assertGreaterEqual(session.paused_at, before_call)
    self.assertLessEqual(session.paused_at, timezone.now())

  def test_mark_paused_increments_pause_count(self):
    """mark_paused는 pause_count를 1 증가시킨다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.IN_PROGRESS, pause_count=0)
    session.mark_paused("사유")
    session.refresh_from_db()
    self.assertEqual(session.pause_count, 1)

  def test_mark_paused_sets_pause_reason(self):
    """mark_paused는 pause_reason을 설정한다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    session.mark_paused("네트워크 불안정")
    session.refresh_from_db()
    self.assertEqual(session.pause_reason, "네트워크 불안정")

  def test_mark_paused_called_twice_increments_pause_count_to_two(self):
    """mark_paused를 두 번 호출하면 pause_count가 2가 된다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.IN_PROGRESS, pause_count=0)
    session.mark_paused("첫 번째 사유")
    session.interview_session_status = InterviewSessionStatus.IN_PROGRESS  # 강제 진행중 변경
    session.save()
    session.mark_paused("두 번째 사유")
    session.refresh_from_db()
    self.assertEqual(session.pause_count, 2)


class InterviewSessionMarkResumedTests(TestCase):
  """InterviewSession.mark_resumed 테스트"""

  def test_mark_resumed_raises_value_error_if_not_paused(self):
    """상태가 PAUSED가 아닐 때 mark_resumed를 호출하면 ValueError가 발생한다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    with self.assertRaises(ValueError):
      session.mark_resumed()

  def test_mark_resumed_changes_status_to_in_progress(self):
    """mark_resumed 호출 시 상태가 IN_PROGRESS로 변경된다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.PAUSED, paused_at=timezone.now())
    session.mark_resumed()
    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_mark_resumed_clears_paused_at(self):
    """mark_resumed는 paused_at을 None으로 초기화한다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.PAUSED, paused_at=timezone.now())
    session.mark_resumed()
    session.refresh_from_db()
    self.assertIsNone(session.paused_at)

  def test_mark_resumed_clears_pause_reason(self):
    """mark_resumed는 pause_reason을 빈 문자열로 초기화한다."""
    session = InterviewSessionFactory(
      interview_session_status=InterviewSessionStatus.PAUSED, paused_at=timezone.now(), pause_reason="사유"
    )
    session.mark_resumed()
    session.refresh_from_db()
    self.assertEqual(session.pause_reason, "")

  def test_mark_resumed_accumulates_paused_duration_ms(self):
    """mark_resumed는 정지 시간을 total_paused_duration_ms에 누적한다."""
    past_time = timezone.now() - timedelta(seconds=5)
    session = InterviewSessionFactory(
      interview_session_status=InterviewSessionStatus.PAUSED, paused_at=past_time, total_paused_duration_ms=0
    )
    session.mark_resumed()
    session.refresh_from_db()

    # 5초 (5000ms) 근처여야 함
    self.assertGreater(session.total_paused_duration_ms, 4500)
    self.assertLess(session.total_paused_duration_ms, 5500)


class InterviewSessionMarkOwnerChangedTests(TestCase):
  """InterviewSession.mark_owner_changed 테스트"""

  def test_mark_owner_changed_sets_token_hash(self):
    """mark_owner_changed는 owner_token_hash를 설정한다."""
    session = InterviewSessionFactory(owner_token_hash="")
    session.mark_owner_changed("new_hash")
    session.refresh_from_db()
    self.assertEqual(session.owner_token_hash, "new_hash")

  def test_mark_owner_changed_increments_owner_version(self):
    """mark_owner_changed는 owner_version을 1 증가시킨다."""
    session = InterviewSessionFactory(owner_version=0)
    session.mark_owner_changed("new_hash")
    session.refresh_from_db()
    self.assertEqual(session.owner_version, 1)

  def test_mark_owner_changed_called_twice_increments_owner_version_to_two(self):
    """mark_owner_changed를 두 번 호출하면 owner_version이 2가 된다."""
    session = InterviewSessionFactory(owner_version=0)
    session.mark_owner_changed("hash_1")
    session.mark_owner_changed("hash_2")
    session.refresh_from_db()
    self.assertEqual(session.owner_version, 2)


class InterviewSessionDefaultPauseAndOwnershipFieldsTests(TestCase):
  """InterviewSession 기본값 필드 테스트"""

  def test_default_paused_at_is_none(self):
    """paused_at의 기본값은 None이다."""
    session = InterviewSessionFactory()
    self.assertIsNone(session.paused_at)

  def test_default_pause_count_is_zero(self):
    """pause_count의 기본값은 0이다."""
    session = InterviewSessionFactory()
    self.assertEqual(session.pause_count, 0)

  def test_default_total_paused_duration_ms_is_zero(self):
    """total_paused_duration_ms의 기본값은 0이다."""
    session = InterviewSessionFactory()
    self.assertEqual(session.total_paused_duration_ms, 0)

  def test_default_owner_version_is_zero(self):
    """owner_version의 기본값은 0이다."""
    session = InterviewSessionFactory()
    self.assertEqual(session.owner_version, 0)

  def test_default_other_fields(self):
    """pause_reason, last_heartbeat_at, owner_token_hash의 기본값을 검증한다."""
    session = InterviewSessionFactory()
    self.assertEqual(session.pause_reason, "")
    self.assertIsNone(session.last_heartbeat_at)
    self.assertEqual(session.owner_token_hash, "")
