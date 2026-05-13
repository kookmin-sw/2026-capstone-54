"""면접 턴 정렬 및 이어하기 테스트."""

from django.db.models import Case, IntegerField, Value, When
from django.test import TestCase
from interviews.enums import (
  InterviewExchangeType,
  InterviewSessionStatus,
  InterviewSessionType,
)
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from interviews.models import InterviewTurn


def _ordered_turns(session):
  """View와 동일한 정렬 로직으로 턴 목록 조회.

    정렬 순서: turn_number ASC, followup_order ASC
    - NULL(앵커)은 0으로 변환되어 follow-up보다 먼저 표시
    - follow-up은 followup_order 순서로 표시
    """
  return list(
    InterviewTurn.objects.filter(interview_session=session).annotate(
      sort_followup_order=Case(
        When(followup_order__isnull=False, then="followup_order"),
        default=Value(0),
        output_field=IntegerField(),
      ),
    ).order_by("turn_number", "sort_followup_order")
  )


class InterviewTurnOrderingTests(TestCase):
  """InterviewTurn 정렬 테스트"""

  def test_followup_turns_have_turn_number_equal_to_anchor(self):
    """follow-up 턴의 turn_number는 앵커의 turn_number와 동일하다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=2,
    )
    anchor = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=1,
    )
    followup = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor.turn_number,
      followup_order=1,
      anchor_turn=anchor,
    )

    self.assertEqual(anchor.turn_number, 1)
    self.assertEqual(followup.turn_number, 1)
    self.assertEqual(followup.followup_order, 1)

  def test_turns_ordered_by_turn_number_then_followup_order(self):
    """턴 목록이 turn_number ASC, followup_order ASC 순서로 정렬된다.

        follow-up의 turn_number는 앵커의 turn_number와 동일하다.
        순서: anchor1 → fu1_1 → fu1_2 → anchor2 → fu2_1
        """
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=2,
    )

    anchor1 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=1,
    )
    fu1_1 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor1.turn_number,
      followup_order=1,
      anchor_turn=anchor1,
    )
    fu1_2 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor1.turn_number,
      followup_order=2,
      anchor_turn=anchor1,
    )

    anchor2 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=2,
    )
    fu2_1 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor2.turn_number,
      followup_order=1,
      anchor_turn=anchor2,
    )

    ordered_turns = _ordered_turns(session)

    expected_order = [anchor1, fu1_1, fu1_2, anchor2, fu2_1]
    self.assertEqual(ordered_turns, expected_order)


class ResumeInterviewTurnsTests(TestCase):
  """면접 이어하기 테스트 — 첫 번째 미답변 턴 찾기"""

  def test_first_unanswered_after_anchor1_followup1(self):
    """앵커1 답변 후 꼬리질문1 답변 시, 꼬리질문2가 첫 번째 미답변이어야 한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=2,
    )

    anchor1 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=1,
      answer="앵커1 답변 완료",
    )
    InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor1.turn_number,
      followup_order=1,
      anchor_turn=anchor1,
      answer="꼬리질문1.1 답변 완료",
    )
    fu1_2 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor1.turn_number,
      followup_order=2,
      anchor_turn=anchor1,
      answer="",
    )

    InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=2,
      answer="",
    )

    ordered_turns = _ordered_turns(session)
    first_unanswered = next((t for t in ordered_turns if not t.answer), None)

    self.assertIsNotNone(first_unanswered)
    self.assertEqual(first_unanswered.pk, fu1_2.pk)
    self.assertEqual(first_unanswered.turn_type, InterviewExchangeType.FOLLOWUP)
    self.assertEqual(first_unanswered.followup_order, 2)

  def test_first_unanswered_after_all_followups_of_anchor1(self):
    """앵커1의 모든 꼬리질문 답변 후, 앵커2가 첫 번째 미답변이어야 한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=2,
    )

    anchor1 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=1,
      answer="앵커1 답변 완료",
    )
    InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor1.turn_number,
      followup_order=1,
      anchor_turn=anchor1,
      answer="꼬리질문1.1 답변 완료",
    )
    InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor1.turn_number,
      followup_order=2,
      anchor_turn=anchor1,
      answer="꼬리질문1.2 답변 완료",
    )
    InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor1.turn_number,
      followup_order=3,
      anchor_turn=anchor1,
      answer="꼬리질문1.3 답변 완료",
    )

    anchor2 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=2,
      answer="",
    )

    ordered_turns = _ordered_turns(session)
    first_unanswered = next((t for t in ordered_turns if not t.answer), None)

    self.assertIsNotNone(first_unanswered)
    self.assertEqual(first_unanswered.pk, anchor2.pk)
    self.assertEqual(first_unanswered.turn_type, InterviewExchangeType.INITIAL)

  def test_first_unanswered_after_all_questions(self):
    """모든 질문 답변 시 None을 반환해야 한다."""
    session = InterviewSessionFactory(
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=2,
    )

    anchor1 = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=1,
      answer="앵커1 답변 완료",
    )
    InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor1.turn_number,
      followup_order=1,
      anchor_turn=anchor1,
      answer="꼬리질문1.1 답변 완료",
    )

    InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=2,
      answer="앵커2 답변 완료",
    )

    ordered_turns = _ordered_turns(session)
    first_unanswered = next((t for t in ordered_turns if not t.answer), None)

    self.assertIsNone(first_unanswered)
