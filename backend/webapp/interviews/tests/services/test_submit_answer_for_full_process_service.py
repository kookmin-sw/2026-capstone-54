from django.core.exceptions import ValidationError
from django.test import TestCase
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from interviews.services import SubmitAnswerForFullProcessService


class SubmitAnswerForFullProcessServiceHappyPathTests(TestCase):
  """SubmitAnswerForFullProcessService 정상 경로 테스트"""

  def test_saves_answer_to_turn(self):
    """답변이 턴에 저장된다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="", turn_number=1)

    SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn, answer="내 답변입니다.").perform()

    turn.refresh_from_db()
    self.assertEqual(turn.answer, "내 답변입니다.")

  def test_returns_next_unanswered_turn(self):
    """다음 미답변 턴을 반환한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn1 = InterviewTurnFactory(interview_session=session, answer="", turn_number=1)
    turn2 = InterviewTurnFactory(interview_session=session, answer="", turn_number=2)

    next_turn = SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn1,
                                                  answer="답변").perform()

    self.assertIsNotNone(next_turn)
    self.assertEqual(next_turn.pk, turn2.pk)

  def test_returns_none_when_all_turns_answered(self):
    """모든 턴에 답변하면 None을 반환한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="", turn_number=1)

    result = SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn,
                                               answer="마지막 답변").perform()

    self.assertIsNone(result)

  def test_strips_whitespace_from_answer(self):
    """답변의 앞뒤 공백을 제거하여 저장한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="", turn_number=1)

    SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn, answer="  공백 포함 답변  ").perform()

    turn.refresh_from_db()
    self.assertEqual(turn.answer, "공백 포함 답변")

  def test_skips_already_answered_turns_when_returning_next(self):
    """다음 턴 반환 시 이미 답변된 턴은 건너뛴다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn1 = InterviewTurnFactory(interview_session=session, answer="", turn_number=1)
    InterviewTurnFactory(interview_session=session, answer="기존답변", turn_number=2)
    turn3 = InterviewTurnFactory(interview_session=session, answer="", turn_number=3)

    next_turn = SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn1,
                                                  answer="답변").perform()

    self.assertEqual(next_turn.pk, turn3.pk)


class SubmitAnswerForFullProcessServiceValidationTests(TestCase):
  """SubmitAnswerForFullProcessService 유효성 검사 테스트"""

  def test_raises_when_session_not_in_progress(self):
    """세션이 진행 중이 아니면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn, answer="답변").perform()

  def test_raises_when_session_type_is_followup(self):
    """세션 타입이 FOLLOWUP이면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn, answer="답변").perform()

  def test_raises_when_turn_already_has_answer(self):
    """이미 답변이 있는 턴이면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="기존 답변")
    with self.assertRaises(ValidationError):
      SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn, answer="새 답변").perform()

  def test_raises_when_turn_belongs_to_different_session(self):
    """다른 세션의 턴이면 ValidationError를 발생시킨다."""
    session1 = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    session2 = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn = InterviewTurnFactory(interview_session=session2, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerForFullProcessService(interview_session=session1, interview_turn=turn, answer="답변").perform()

  def test_raises_when_answer_is_empty(self):
    """빈 답변이면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn, answer="").perform()

  def test_raises_when_answer_is_whitespace_only(self):
    """공백만 있는 답변이면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerForFullProcessService(interview_session=session, interview_turn=turn, answer="   ").perform()
