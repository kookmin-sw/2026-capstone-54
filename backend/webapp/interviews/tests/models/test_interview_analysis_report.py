from django.test import TestCase
from interviews.enums import InterviewAnalysisReportStatus
from interviews.factories import InterviewAnalysisReportFactory, InterviewSessionFactory


class InterviewAnalysisReportMarkGeneratingTests(TestCase):
  """InterviewAnalysisReport.mark_generating 테스트"""

  def test_mark_generating_sets_status(self):
    """mark_generating 호출 시 상태가 generating으로 변경된다."""
    report = InterviewAnalysisReportFactory(interview_analysis_report_status=InterviewAnalysisReportStatus.PENDING)
    report.mark_generating()
    report.refresh_from_db()
    self.assertEqual(report.interview_analysis_report_status, InterviewAnalysisReportStatus.GENERATING)

  def test_mark_generating_persists_to_db(self):
    """mark_generating은 DB에 저장된다."""
    report = InterviewAnalysisReportFactory()
    report.mark_generating()
    from interviews.models import InterviewAnalysisReport
    updated = InterviewAnalysisReport.objects.get(pk=report.pk)
    self.assertEqual(updated.interview_analysis_report_status, InterviewAnalysisReportStatus.GENERATING)


class InterviewAnalysisReportMarkCompletedTests(TestCase):
  """InterviewAnalysisReport.mark_completed 테스트"""

  def test_mark_completed_sets_status(self):
    """mark_completed 호출 시 상태가 completed로 변경된다."""
    report = InterviewAnalysisReportFactory(interview_analysis_report_status=InterviewAnalysisReportStatus.GENERATING)
    report.mark_completed()
    report.refresh_from_db()
    self.assertEqual(report.interview_analysis_report_status, InterviewAnalysisReportStatus.COMPLETED)


class InterviewAnalysisReportMarkFailedTests(TestCase):
  """InterviewAnalysisReport.mark_failed 테스트"""

  def test_mark_failed_sets_status(self):
    """mark_failed 호출 시 상태가 failed로 변경된다."""
    report = InterviewAnalysisReportFactory(interview_analysis_report_status=InterviewAnalysisReportStatus.GENERATING)
    report.mark_failed()
    report.refresh_from_db()
    self.assertEqual(report.interview_analysis_report_status, InterviewAnalysisReportStatus.FAILED)

  def test_mark_failed_stores_error_message(self):
    """mark_failed에 전달된 메시지가 DB에 저장된다."""
    report = InterviewAnalysisReportFactory()
    report.mark_failed(message="LLM timeout")
    report.refresh_from_db()
    self.assertEqual(report.error_message, "LLM timeout")

  def test_mark_failed_with_empty_message(self):
    """mark_failed에 메시지를 전달하지 않으면 빈 문자열이 저장된다."""
    report = InterviewAnalysisReportFactory()
    report.mark_failed()
    report.refresh_from_db()
    self.assertEqual(report.error_message, "")


class InterviewAnalysisReportStrTests(TestCase):
  """InterviewAnalysisReport.__str__ 테스트"""

  def test_str_contains_pk(self):
    """__str__은 리포트 PK를 포함한다."""
    report = InterviewAnalysisReportFactory()
    result = str(report)
    self.assertIn(str(report.pk), result)

  def test_str_contains_status_display(self):
    """__str__은 상태 표시 문자열을 포함한다."""
    report = InterviewAnalysisReportFactory(interview_analysis_report_status=InterviewAnalysisReportStatus.PENDING)
    result = str(report)
    self.assertIn("대기 중", result)


class InterviewAnalysisReportDefaultValuesTests(TestCase):
  """InterviewAnalysisReport 기본값 테스트"""

  def test_default_status_is_pending(self):
    """생성 시 기본 상태는 pending이다."""
    report = InterviewAnalysisReportFactory()
    self.assertEqual(report.interview_analysis_report_status, InterviewAnalysisReportStatus.PENDING)

  def test_default_json_fields_are_empty_lists(self):
    """category_scores, question_feedbacks, strengths, improvement_areas 기본값은 빈 리스트이다."""
    report = InterviewAnalysisReportFactory()
    self.assertEqual(report.category_scores, [])
    self.assertEqual(report.question_feedbacks, [])
    self.assertEqual(report.strengths, [])
    self.assertEqual(report.improvement_areas, [])

  def test_default_overall_score_is_none(self):
    """overall_score 기본값은 None이다."""
    report = InterviewAnalysisReportFactory()
    self.assertIsNone(report.overall_score)

  def test_one_to_one_relation_with_session(self):
    """interview_session과 1:1 관계가 성립한다."""
    session = InterviewSessionFactory()
    report = InterviewAnalysisReportFactory(interview_session=session)
    self.assertEqual(session.analysis_report, report)
