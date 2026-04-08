# Feature: interview-analysis-report, Property 10: 세션-리포트 1:1 관계 제약
"""
Property 10: 세션-리포트 1:1 관계 제약

For any InterviewSession, at most one AnalysisReport can exist.
Attempting to create a second report for the same session should raise
an IntegrityError rather than creating a duplicate.

**Validates: Requirements 7.2, 7.5**
"""

from django.db import IntegrityError, transaction
from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from interview.enums import AnalysisReportStatus
from interview.models import AnalysisReport, InterviewSession

status_values = st.sampled_from(
  [AnalysisReportStatus.GENERATING, AnalysisReportStatus.COMPLETED, AnalysisReportStatus.FAILED]
)

score_values = st.integers(min_value=0, max_value=100)


class AnalysisReportOneToOnePropertyTests(TestCase):
  """Property 10: 세션-리포트 1:1 관계 제약 테스트"""

  def setUp(self):
    self.session = InterviewSession.objects.create(
      model_name="gpt-4o-mini",
      difficulty_level="normal",
      status=InterviewSession.Status.COMPLETED,
      started_at=timezone.now(),
    )

  @given(status=status_values)
  @settings(max_examples=100, deadline=None)
  def test_single_report_per_session(self, status):
    """하나의 세션에 대해 하나의 리포트만 존재할 수 있다.

        **Validates: Requirements 7.2**
        """
    report = AnalysisReport.objects.create(
      session=self.session,
      status=status,
    )

    with self.assertRaises(IntegrityError):
      with transaction.atomic():
        AnalysisReport.objects.create(
          session=self.session,
          status=AnalysisReportStatus.GENERATING,
        )

    report.delete()

  @given(
    first_score=score_values,
    second_score=score_values,
  )
  @settings(max_examples=100, deadline=None)
  def test_replace_existing_report(self, first_score, second_score):
    """기존 리포트를 삭제 후 새 리포트를 생성하면 대체된다.

        **Validates: Requirements 7.5**
        """
    first_report = AnalysisReport.objects.create(
      session=self.session,
      status=AnalysisReportStatus.COMPLETED,
      overall_score=first_score,
    )
    first_id = first_report.id

    # 기존 리포트 삭제 후 새로 생성
    first_report.delete()
    second_report = AnalysisReport.objects.create(
      session=self.session,
      status=AnalysisReportStatus.COMPLETED,
      overall_score=second_score,
    )

    self.assertNotEqual(second_report.id, first_id)
    self.assertEqual(second_report.overall_score, second_score)
    self.assertEqual(AnalysisReport.objects.filter(session=self.session).count(), 1)

    second_report.delete()

  def test_different_sessions_can_have_reports(self):
    """서로 다른 세션은 각각 리포트를 가질 수 있다.

        **Validates: Requirements 7.2**
        """
    session2 = InterviewSession.objects.create(
      model_name="gpt-4o-mini",
      difficulty_level="normal",
      status=InterviewSession.Status.COMPLETED,
      started_at=timezone.now(),
    )

    report1 = AnalysisReport.objects.create(
      session=self.session,
      status=AnalysisReportStatus.COMPLETED,
    )
    report2 = AnalysisReport.objects.create(
      session=session2,
      status=AnalysisReportStatus.COMPLETED,
    )

    self.assertEqual(AnalysisReport.objects.count(), 2)
    self.assertNotEqual(report1.session_id, report2.session_id)
