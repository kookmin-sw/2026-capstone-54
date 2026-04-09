from unittest.mock import MagicMock, patch

from common.exceptions import ValidationException
from django.test import TestCase
from interviews.enums import InterviewExchangeType, InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory
from interviews.schemas import QuestionGeneratorOutput
from interviews.services import GenerateInitialQuestionsService


def _make_question(question="테스트 질문입니다.", source="resume"):
  q = MagicMock()
  q.question = question
  q.source = source
  return q


def _make_llm_output(questions=None):
  output = MagicMock(spec=QuestionGeneratorOutput)
  output.questions = questions or [_make_question()]
  return output


def _make_callback(input_tokens=10, output_tokens=20):
  callback = MagicMock()
  usage = MagicMock()
  usage.input_tokens = input_tokens
  usage.output_tokens = output_tokens
  callback.get_usage.return_value = usage
  return callback


class GenerateInitialQuestionsServiceHappyPathTests(TestCase):
  """GenerateInitialQuestionsService 정상 경로 테스트"""

  @patch("interviews.services.generate_initial_questions_service.TokenUsage.log")
  @patch("interviews.services.generate_initial_questions_service.FollowupInterviewQuestionGenerator")
  def test_returns_interview_turns_for_followup_session(self, MockGenerator, mock_log):
    """FOLLOWUP 세션에서 초기 질문 턴 목록을 반환한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=0,
    )
    questions = [_make_question("질문1"), _make_question("질문2")]
    mock_instance = MockGenerator.return_value
    mock_instance.generate.return_value = _make_llm_output(questions)

    with patch(
      "interviews.services.generate_initial_questions_service.TokenUsageCallback", return_value=_make_callback()
    ):
      turns = GenerateInitialQuestionsService(interview_session=session).perform()

    self.assertEqual(len(list(turns)), 2)

  @patch("interviews.services.generate_initial_questions_service.TokenUsage.log")
  @patch("interviews.services.generate_initial_questions_service.FullProcessInterviewQuestionGenerator")
  def test_returns_interview_turns_for_full_process_session(self, MockGenerator, mock_log):
    """FULL_PROCESS 세션에서 초기 질문 턴 목록을 반환한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=0,
    )
    mock_instance = MockGenerator.return_value
    mock_instance.generate.return_value = _make_llm_output([_make_question()])

    with patch(
      "interviews.services.generate_initial_questions_service.TokenUsageCallback", return_value=_make_callback()
    ):
      turns = GenerateInitialQuestionsService(interview_session=session).perform()

    self.assertGreaterEqual(len(list(turns)), 1)

  @patch("interviews.services.generate_initial_questions_service.TokenUsage.log")
  @patch("interviews.services.generate_initial_questions_service.FollowupInterviewQuestionGenerator")
  def test_updates_total_questions_on_session(self, MockGenerator, mock_log):
    """초기 질문 생성 후 session.total_questions가 업데이트된다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=0,
    )
    questions = [_make_question(), _make_question(), _make_question()]
    mock_instance = MockGenerator.return_value
    mock_instance.generate.return_value = _make_llm_output(questions)

    with patch(
      "interviews.services.generate_initial_questions_service.TokenUsageCallback", return_value=_make_callback()
    ):
      GenerateInitialQuestionsService(interview_session=session).perform()

    session.refresh_from_db()
    self.assertEqual(session.total_questions, 3)

  @patch("interviews.services.generate_initial_questions_service.TokenUsage.log")
  @patch("interviews.services.generate_initial_questions_service.FollowupInterviewQuestionGenerator")
  def test_created_turns_have_initial_type(self, MockGenerator, mock_log):
    """생성된 턴의 turn_type은 INITIAL이다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=0,
    )
    mock_instance = MockGenerator.return_value
    mock_instance.generate.return_value = _make_llm_output([_make_question()])

    with patch(
      "interviews.services.generate_initial_questions_service.TokenUsageCallback", return_value=_make_callback()
    ):
      turns = GenerateInitialQuestionsService(interview_session=session).perform()

    for turn in turns:
      self.assertEqual(turn.turn_type, InterviewExchangeType.INITIAL)


class GenerateInitialQuestionsServiceValidationTests(TestCase):
  """GenerateInitialQuestionsService 유효성 검사 테스트"""

  def test_raises_when_session_not_in_progress(self):
    """세션이 진행 중이 아니면 ValidationException을 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_status=InterviewSessionStatus.COMPLETED,
      total_questions=0,
    )
    with self.assertRaises(ValidationException):
      GenerateInitialQuestionsService(interview_session=session).perform()

  def test_raises_when_questions_already_generated(self):
    """이미 초기 질문이 생성된 세션이면 ValidationException을 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=5,
    )
    with self.assertRaises(ValidationException):
      GenerateInitialQuestionsService(interview_session=session).perform()

  def test_raises_when_session_abandoned(self):
    """이탈된 세션이면 ValidationException을 발생시킨다."""
    session = InterviewSessionFactory(
      interview_session_status=InterviewSessionStatus.ABANDONED,
      total_questions=0,
    )
    with self.assertRaises(ValidationException):
      GenerateInitialQuestionsService(interview_session=session).perform()
