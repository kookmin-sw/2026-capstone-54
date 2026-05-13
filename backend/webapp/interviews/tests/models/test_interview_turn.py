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


class InterviewTurnMetricsDefaultValuesTests(TestCase):
  """InterviewTurn 행동/발화 메트릭 기본값 테스트"""

  def test_default_gaze_away_count_is_zero(self):
    """gaze_away_count 기본값은 0이다."""
    turn = InterviewTurnFactory()
    self.assertEqual(turn.gaze_away_count, 0)

  def test_default_head_away_count_is_zero(self):
    """head_away_count 기본값은 0이다."""
    turn = InterviewTurnFactory()
    self.assertEqual(turn.head_away_count, 0)

  def test_default_speech_rate_sps_is_none(self):
    """speech_rate_sps 기본값은 None이다 (미측정 turn 표현)."""
    turn = InterviewTurnFactory()
    self.assertIsNone(turn.speech_rate_sps)

  def test_default_pillar_word_counts_is_empty_dict(self):
    """pillar_word_counts 기본값은 빈 dict이다."""
    turn = InterviewTurnFactory()
    self.assertEqual(turn.pillar_word_counts, {})


class InterviewTurnMetricsPersistenceTests(TestCase):
  """InterviewTurn 행동/발화 메트릭 저장/조회 테스트"""

  def test_gaze_away_count_persists_to_db(self):
    """gaze_away_count 값을 저장하면 DB에 반영된다."""
    turn = InterviewTurnFactory()
    turn.gaze_away_count = 7
    turn.save(update_fields=["gaze_away_count"])
    turn.refresh_from_db()
    self.assertEqual(turn.gaze_away_count, 7)

  def test_head_away_count_persists_to_db(self):
    """head_away_count 값을 저장하면 DB에 반영된다."""
    turn = InterviewTurnFactory()
    turn.head_away_count = 3
    turn.save(update_fields=["head_away_count"])
    turn.refresh_from_db()
    self.assertEqual(turn.head_away_count, 3)

  def test_speech_rate_sps_persists_float_value(self):
    """speech_rate_sps에 float 값을 저장할 수 있다."""
    turn = InterviewTurnFactory()
    turn.speech_rate_sps = 5.42
    turn.save(update_fields=["speech_rate_sps"])
    turn.refresh_from_db()
    self.assertAlmostEqual(turn.speech_rate_sps, 5.42, places=2)

  def test_speech_rate_sps_can_be_null(self):
    """speech_rate_sps에 None을 저장할 수 있다."""
    turn = InterviewTurnFactory()
    turn.speech_rate_sps = 4.0
    turn.save(update_fields=["speech_rate_sps"])
    turn.speech_rate_sps = None
    turn.save(update_fields=["speech_rate_sps"])
    turn.refresh_from_db()
    self.assertIsNone(turn.speech_rate_sps)

  def test_pillar_word_counts_persists_dict(self):
    """pillar_word_counts에 단어별 빈도 dict를 저장할 수 있다."""
    turn = InterviewTurnFactory()
    counts = {"음": 5, "어": 3, "근데": 1}
    turn.pillar_word_counts = counts
    turn.save(update_fields=["pillar_word_counts"])
    turn.refresh_from_db()
    self.assertEqual(turn.pillar_word_counts, counts)

  def test_pillar_word_counts_preserves_korean_keys(self):
    """pillar_word_counts에 한국어 key가 유실 없이 저장된다."""
    turn = InterviewTurnFactory()
    turn.pillar_word_counts = {"으음": 2, "그러니까": 4}
    turn.save(update_fields=["pillar_word_counts"])
    turn.refresh_from_db()
    self.assertEqual(turn.pillar_word_counts.get("으음"), 2)
    self.assertEqual(turn.pillar_word_counts.get("그러니까"), 4)

  def test_metrics_isolated_per_turn(self):
    """각 turn의 메트릭은 독립적으로 저장된다."""
    session = InterviewSessionFactory()
    turn_a = InterviewTurnFactory(interview_session=session, turn_number=1)
    turn_b = InterviewTurnFactory(interview_session=session, turn_number=2)

    turn_a.gaze_away_count = 10
    turn_a.pillar_word_counts = {"음": 2}
    turn_a.save(update_fields=["gaze_away_count", "pillar_word_counts"])

    turn_b.refresh_from_db()
    self.assertEqual(turn_b.gaze_away_count, 0)
    self.assertEqual(turn_b.pillar_word_counts, {})
