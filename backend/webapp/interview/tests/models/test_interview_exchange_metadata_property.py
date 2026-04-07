# Feature: interview-analysis-report, Property 13: Exchange 질문 메타데이터 저장 정확성
"""
Property 13: Exchange 질문 메타데이터 저장 정확성

For any InterviewExchange:
- If it is an initial question, question_source should match the source value provided.
- If it is a followup question, question_purpose should match the rationale value provided.
- If no value is provided, the field should default to an empty string.

**Validates: Requirements 10.3, 10.4, 10.5**
"""

from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from interview.models import InterviewExchange, InterviewSession

# --- Strategies ---

source_values = st.sampled_from(["resume", "job_posting"])

rationale_values = st.text(
  alphabet=st.characters(whitelist_categories=("L", "N", "P", "Z"), blacklist_characters="\x00"),
  min_size=1,
  max_size=200,
)

question_text = st.text(
  alphabet=st.characters(blacklist_categories=("Cs", ), blacklist_characters="\x00"),
  min_size=1,
  max_size=300,
)
answer_text = st.text(
  alphabet=st.characters(blacklist_categories=("Cs", ), blacklist_characters="\x00"),
  min_size=1,
  max_size=500,
)
depth_values = st.integers(min_value=0, max_value=5)


class InterviewExchangeMetadataPropertyTests(TestCase):
  """Property 13: Exchange 질문 메타데이터 저장 정확성 테스트"""

  def setUp(self):
    self.session = InterviewSession.objects.create(
      model_name="gpt-4o-mini",
      difficulty_level="normal",
      status=InterviewSession.Status.IN_PROGRESS,
      started_at=timezone.now(),
    )

  @given(
    source=source_values,
    question=question_text,
    answer=answer_text,
  )
  @settings(max_examples=100, deadline=None)
  def test_initial_question_source_stored_accurately(self, source, question, answer):
    """초기 질문의 question_source는 제공된 source 값과 정확히 일치해야 한다.

        **Validates: Requirements 10.3**
        """
    exchange = InterviewExchange.objects.create(
      session=self.session,
      exchange_type=InterviewExchange.ExchangeType.INITIAL,
      depth=0,
      question=question,
      answer=answer,
      question_source=source,
    )

    exchange.refresh_from_db()
    self.assertEqual(exchange.question_source, source)
    self.assertEqual(exchange.exchange_type, "initial")

    exchange.delete()

  @given(
    rationale=rationale_values,
    question=question_text,
    answer=answer_text,
    depth=depth_values,
  )
  @settings(max_examples=100, deadline=None)
  def test_followup_question_purpose_stored_accurately(self, rationale, question, answer, depth):
    """꼬리질문의 question_purpose는 제공된 rationale 값과 정확히 일치해야 한다.

        **Validates: Requirements 10.4**
        """
    actual_depth = max(depth, 1)  # followup depth is at least 1

    exchange = InterviewExchange.objects.create(
      session=self.session,
      exchange_type=InterviewExchange.ExchangeType.FOLLOWUP,
      depth=actual_depth,
      question=question,
      answer=answer,
      question_purpose=rationale,
    )

    exchange.refresh_from_db()
    self.assertEqual(exchange.question_purpose, rationale)
    self.assertEqual(exchange.exchange_type, "followup")

    exchange.delete()

  @given(
    exchange_type=st.sampled_from(["initial", "followup"]),
    question=question_text,
    answer=answer_text,
  )
  @settings(max_examples=100, deadline=None)
  def test_missing_metadata_defaults_to_empty_string(self, exchange_type, question, answer):
    """question_source 또는 question_purpose 값이 제공되지 않으면 빈 문자열로 저장된다.

        **Validates: Requirements 10.5**
        """
    depth = 0 if exchange_type == "initial" else 1

    exchange = InterviewExchange.objects.create(
      session=self.session,
      exchange_type=exchange_type,
      depth=depth,
      question=question,
      answer=answer,
    )

    exchange.refresh_from_db()
    self.assertEqual(exchange.question_source, "")
    self.assertEqual(exchange.question_purpose, "")

    exchange.delete()
