from unittest.mock import MagicMock, patch

from django.core.exceptions import ValidationError
from django.test import TestCase
from interviews.constants import MAX_FOLLOWUP_PER_ANCHOR
from interviews.enums import InterviewExchangeType, InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from interviews.services import SubmitAnswerAndGenerateFollowupService
from interviews.services.submit_answer_and_generate_followup_service import FollowupResult


def _make_followup_output(followup_questions=None):
  output = MagicMock()
  if followup_questions is None:
    fq = MagicMock()
    fq.question = "꼬리질문입니다."
    followup_questions = [fq]
  output.followup_questions = followup_questions
  return output


def _make_callback(input_tokens=10, output_tokens=20):
  callback = MagicMock()
  usage = MagicMock()
  usage.input_tokens = input_tokens
  usage.output_tokens = output_tokens
  callback.get_usage.return_value = usage
  return callback


class FollowupResultNamedTupleTests(TestCase):
  """FollowupResult NamedTuple 테스트"""

  def test_followup_result_has_turns_field(self):
    """FollowupResult에 turns 필드가 있다."""
    result = FollowupResult(turns=[], followup_exhausted=False)
    self.assertEqual(result.turns, [])

  def test_followup_result_has_followup_exhausted_field(self):
    """FollowupResult에 followup_exhausted 필드가 있다."""
    result = FollowupResult(turns=[], followup_exhausted=True)
    self.assertTrue(result.followup_exhausted)

  def test_followup_result_is_namedtuple(self):
    """FollowupResult는 NamedTuple이다."""
    result = FollowupResult(turns=["t"], followup_exhausted=False)
    self.assertEqual(result[0], ["t"])
    self.assertEqual(result[1], False)


class SubmitAnswerAndGenerateFollowupServiceHappyPathTests(TestCase):
  """SubmitAnswerAndGenerateFollowupService 정상 경로 테스트"""

  @patch("interviews.services.submit_answer_and_generate_followup_service.TokenUsage.log")
  @patch("interviews.services.submit_answer_and_generate_followup_service.FollowUpQuestionGenerator")
  def test_saves_answer_to_turn(self, MockGenerator, mock_log):
    """답변이 턴에 저장된다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    mock_instance = MockGenerator.return_value
    mock_instance.generate.return_value = _make_followup_output()

    with patch(
      "interviews.services.submit_answer_and_generate_followup_service.TokenUsageCallback",
      return_value=_make_callback()
    ):
      SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn,
                                             answer="제 답변입니다.").perform()

    turn.refresh_from_db()
    self.assertEqual(turn.answer, "제 답변입니다.")

  @patch("interviews.services.submit_answer_and_generate_followup_service.TokenUsage.log")
  @patch("interviews.services.submit_answer_and_generate_followup_service.FollowUpQuestionGenerator")
  def test_returns_followup_result_with_new_turns(self, MockGenerator, mock_log):
    """FollowupResult에 새로 생성된 꼬리질문 턴이 포함된다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    mock_instance = MockGenerator.return_value
    mock_instance.generate.return_value = _make_followup_output()

    with patch(
      "interviews.services.submit_answer_and_generate_followup_service.TokenUsageCallback",
      return_value=_make_callback()
    ):
      result = SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn,
                                                      answer="답변").perform()

    self.assertIsInstance(result, FollowupResult)
    self.assertEqual(len(result.turns), 1)
    self.assertEqual(result.turns[0].turn_type, InterviewExchangeType.FOLLOWUP)

  @patch("interviews.services.submit_answer_and_generate_followup_service.TokenUsage.log")
  @patch("interviews.services.submit_answer_and_generate_followup_service.FollowUpQuestionGenerator")
  def test_increments_total_followup_questions(self, MockGenerator, mock_log):
    """꼬리질문 생성 후 session.total_followup_questions가 증가한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    mock_instance = MockGenerator.return_value
    mock_instance.generate.return_value = _make_followup_output()

    with patch(
      "interviews.services.submit_answer_and_generate_followup_service.TokenUsageCallback",
      return_value=_make_callback()
    ):
      SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn, answer="답변").perform()

    session.refresh_from_db()
    self.assertEqual(session.total_followup_questions, 1)

  @patch("interviews.services.submit_answer_and_generate_followup_service.TokenUsage.log")
  @patch("interviews.services.submit_answer_and_generate_followup_service.FollowUpQuestionGenerator")
  def test_followup_exhausted_false_when_below_max(self, MockGenerator, mock_log):
    """꼬리질문 수가 최대 미만이면 followup_exhausted는 False이다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    mock_instance = MockGenerator.return_value
    mock_instance.generate.return_value = _make_followup_output()

    with patch(
      "interviews.services.submit_answer_and_generate_followup_service.TokenUsageCallback",
      return_value=_make_callback()
    ):
      result = SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn,
                                                      answer="답변").perform()

    self.assertFalse(result.followup_exhausted)

  @patch("interviews.services.submit_answer_and_generate_followup_service.TokenUsage.log")
  @patch("interviews.services.submit_answer_and_generate_followup_service.FollowUpQuestionGenerator")
  def test_followup_exhausted_true_when_at_max(self, MockGenerator, mock_log):
    """앵커의 꼬리질문이 최대에 도달하고 다음 앵커가 없으면 followup_exhausted는 True이다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=1,
      total_followup_questions=MAX_FOLLOWUP_PER_ANCHOR - 1,
    )
    # 앵커 턴 (INITIAL)
    anchor = InterviewTurnFactory(
      interview_session=session,
      answer="앵커답변",
      turn_number=1,
      turn_type=InterviewExchangeType.INITIAL,
    )
    # 앵커에 MAX-1개의 기존 followup 턴 연결
    for i in range(MAX_FOLLOWUP_PER_ANCHOR - 1):
      InterviewTurnFactory(
        interview_session=session,
        answer="답변",
        turn_number=10 + i,
        turn_type=InterviewExchangeType.FOLLOWUP,
        anchor_turn=anchor,
      )
    # 현재 답변할 마지막 followup 턴
    turn = InterviewTurnFactory(
      interview_session=session,
      answer="",
      turn_number=20,
      turn_type=InterviewExchangeType.FOLLOWUP,
      anchor_turn=anchor,
    )
    mock_instance = MockGenerator.return_value
    mock_instance.generate.return_value = _make_followup_output()

    with patch(
      "interviews.services.submit_answer_and_generate_followup_service.TokenUsageCallback",
      return_value=_make_callback()
    ):
      result = SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn,
                                                      answer="답변").perform()

    self.assertTrue(result.followup_exhausted)


class SubmitAnswerAndGenerateFollowupServiceExhaustedTests(TestCase):
  """앵커당 꼬리질문 한도 도달 시 테스트"""

  def _make_exhausted_session_and_turn(self):
    """앵커의 followup_turns가 MAX_FOLLOWUP_PER_ANCHOR에 도달한 세션과 턴을 생성한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=1,
      total_followup_questions=MAX_FOLLOWUP_PER_ANCHOR,
    )
    anchor = InterviewTurnFactory(
      interview_session=session,
      answer="앵커답변",
      turn_number=1,
      turn_type=InterviewExchangeType.INITIAL,
    )
    for i in range(MAX_FOLLOWUP_PER_ANCHOR):
      InterviewTurnFactory(
        interview_session=session,
        answer="답변",
        turn_number=10 + i,
        turn_type=InterviewExchangeType.FOLLOWUP,
        anchor_turn=anchor,
      )
    # 현재 답변할 턴 (이 앵커의 마지막 followup)
    turn = InterviewTurnFactory(
      interview_session=session,
      answer="",
      turn_number=20,
      turn_type=InterviewExchangeType.FOLLOWUP,
      anchor_turn=anchor,
    )
    return session, turn

  def test_saves_answer_only_when_exhausted(self):
    """앵커 꼬리질문 한도 도달 시 답변만 저장하고 다음 앵커가 없으면 빈 turns를 반환한다."""
    session, turn = self._make_exhausted_session_and_turn()

    result = SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn,
                                                    answer="내 답변").perform()

    turn.refresh_from_db()
    self.assertEqual(turn.answer, "내 답변")
    self.assertEqual(result.turns, [])
    self.assertTrue(result.followup_exhausted)

  def test_no_llm_call_when_exhausted(self):
    """앵커 꼬리질문 한도 도달 시 LLM을 호출하지 않는다."""
    session, turn = self._make_exhausted_session_and_turn()

    with patch("interviews.services.submit_answer_and_generate_followup_service.FollowUpQuestionGenerator") as MockGen:
      SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn, answer="답변").perform()
      MockGen.assert_not_called()


class SubmitAnswerAndGenerateFollowupServiceValidationTests(TestCase):
  """SubmitAnswerAndGenerateFollowupService 유효성 검사 테스트"""

  def test_raises_when_session_not_in_progress(self):
    """세션이 진행 중이 아니면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.COMPLETED,
      total_questions=3,
      total_followup_questions=0,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn, answer="답변").perform()

  def test_raises_when_session_type_is_full_process(self):
    """세션 타입이 FULL_PROCESS이면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn, answer="답변").perform()

  def test_raises_when_turn_already_has_answer(self):
    """이미 답변이 있는 턴이면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="기존 답변")
    with self.assertRaises(ValidationError):
      SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn, answer="새 답변").perform()

  def test_raises_when_turn_belongs_to_different_session(self):
    """다른 세션의 턴이면 ValidationError를 발생시킨다."""
    session1 = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    session2 = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    turn = InterviewTurnFactory(interview_session=session2, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerAndGenerateFollowupService(interview_session=session1, interview_turn=turn, answer="답변").perform()

  def test_raises_when_answer_is_empty(self):
    """답변이 빈 문자열이면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn, answer="").perform()

  def test_raises_when_answer_is_whitespace_only(self):
    """답변이 공백만 있으면 ValidationError를 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    turn = InterviewTurnFactory(interview_session=session, answer="")
    with self.assertRaises(ValidationError):
      SubmitAnswerAndGenerateFollowupService(interview_session=session, interview_turn=turn, answer="   ").perform()
