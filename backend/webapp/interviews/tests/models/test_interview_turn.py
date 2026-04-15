from django.test import TestCase
from interviews.enums import InterviewExchangeType, QuestionSource
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory


class InterviewTurnStrTests(TestCase):
  """InterviewTurn.__str__ 테스트"""

  def test_str_contains_pk(self):
    """__str__은 턴 PK를 포함한다."""
    turn = InterviewTurnFactory()
    result = str(turn)
    self.assertIn(str(turn.pk), result)

  def test_str_contains_turn_type_display(self):
    """__str__은 턴 유형 표시 문자열을 포함한다."""
    turn = InterviewTurnFactory(turn_type=InterviewExchangeType.INITIAL)
    result = str(turn)
    self.assertIn("초기 질문", result)

  def test_str_followup_type_display(self):
    """__str__은 FOLLOWUP 유형 표시 문자열을 포함한다."""
    turn = InterviewTurnFactory(turn_type=InterviewExchangeType.FOLLOWUP)
    result = str(turn)
    self.assertIn("꼬리질문", result)

  def test_str_contains_session_id(self):
    """__str__은 세션 ID를 포함한다."""
    session = InterviewSessionFactory()
    turn = InterviewTurnFactory(interview_session=session)
    result = str(turn)
    self.assertIn(str(session.pk), result)


class InterviewTurnDefaultValuesTests(TestCase):
  """InterviewTurn 기본값 테스트"""

  def test_default_answer_is_empty_string(self):
    """생성 시 answer 기본값은 빈 문자열이다."""
    turn = InterviewTurnFactory()
    self.assertEqual(turn.answer, "")

  def test_default_question_source_is_unknown(self):
    """question_source 기본값은 unknown이다."""
    turn = InterviewTurnFactory(question_source=QuestionSource.UNKNOWN)
    self.assertEqual(turn.question_source, QuestionSource.UNKNOWN)

  def test_turn_belongs_to_session(self):
    """InterviewTurn은 세션에 속한다."""
    session = InterviewSessionFactory()
    turn = InterviewTurnFactory(interview_session=session)
    self.assertEqual(turn.interview_session, session)


class InterviewTurnOrderingTests(TestCase):
  """InterviewTurn 정렬 테스트"""

  def test_turns_ordered_by_created_at(self):
    """턴 목록은 created_at 순으로 정렬된다."""
    session = InterviewSessionFactory()
    turn1 = InterviewTurnFactory(interview_session=session, turn_number=1)
    turn2 = InterviewTurnFactory(interview_session=session, turn_number=2)
    turns = list(session.turns.all())
    self.assertEqual(turns[0].pk, turn1.pk)
    self.assertEqual(turns[1].pk, turn2.pk)

  def test_multiple_turns_same_session(self):
    """같은 세션에 여러 턴을 생성할 수 있다."""
    session = InterviewSessionFactory()
    InterviewTurnFactory(interview_session=session, turn_number=1)
    InterviewTurnFactory(interview_session=session, turn_number=2)
    InterviewTurnFactory(interview_session=session, turn_number=3)
    self.assertEqual(session.turns.count(), 3)
