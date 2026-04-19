from unittest.mock import ANY, patch

from django.test import TestCase
from interviews.enums import InterviewAnalysisReportStatus
from interviews.factories import InterviewAnalysisReportFactory
from interviews.services import regenerate_analysis_report


class RegenerateAnalysisReportServiceTests(TestCase):
  """regenerate_analysis_report 서비스 테스트"""

  @patch("interviews.services.regenerate_analysis_report_service.current_app")
  def test_resets_status_to_pending(self, mock_celery):
    """리포트 상태가 pending으로 초기화된다."""
    report = InterviewAnalysisReportFactory(interview_analysis_report_status=InterviewAnalysisReportStatus.FAILED)
    regenerate_analysis_report(report)
    report.refresh_from_db()
    self.assertEqual(
      report.interview_analysis_report_status,
      InterviewAnalysisReportStatus.PENDING,
    )

  @patch("interviews.services.regenerate_analysis_report_service.current_app")
  def test_clears_error_message(self, mock_celery):
    """에러 메시지가 빈 문자열로 초기화된다."""
    report = InterviewAnalysisReportFactory(interview_analysis_report_status=InterviewAnalysisReportStatus.FAILED)
    report.error_message = "이전 에러"
    report.save(update_fields=["error_message"])
    regenerate_analysis_report(report)
    report.refresh_from_db()
    self.assertEqual(report.error_message, "")

  @patch("interviews.services.regenerate_analysis_report_service.current_app")
  def test_clears_overall_score(self, mock_celery):
    """overall_score가 None으로 초기화된다."""
    report = InterviewAnalysisReportFactory()
    report.overall_score = 85
    report.save(update_fields=["overall_score"])
    regenerate_analysis_report(report)
    report.refresh_from_db()
    self.assertIsNone(report.overall_score)

  @patch("interviews.services.regenerate_analysis_report_service.current_app")
  def test_clears_json_fields(self, mock_celery):
    """JSON 필드들이 빈 리스트로 초기화된다."""
    report = InterviewAnalysisReportFactory()
    report.category_scores = [{"category": "기술", "score": 90}]
    report.question_feedbacks = [{"q": "질문", "feedback": "좋아요"}]
    report.strengths = ["강점1"]
    report.improvement_areas = ["개선1"]
    report.save(update_fields=[
      "category_scores",
      "question_feedbacks",
      "strengths",
      "improvement_areas",
    ])

    regenerate_analysis_report(report)
    report.refresh_from_db()

    self.assertEqual(report.category_scores, [])
    self.assertEqual(report.question_feedbacks, [])
    self.assertEqual(report.strengths, [])
    self.assertEqual(report.improvement_areas, [])

  @patch("interviews.services.regenerate_analysis_report_service.current_app")
  def test_sends_celery_task(self, mock_celery):
    """Celery 태스크가 발행된다."""
    report = InterviewAnalysisReportFactory()
    regenerate_analysis_report(report)
    mock_celery.send_task.assert_called_once_with(
      "analysis.tasks.generate_report.generate_analysis_report",
      args=[report.pk],
      kwargs=ANY,
      queue="analysis",
    )

  @patch("interviews.services.regenerate_analysis_report_service.current_app")
  def test_celery_task_called_after_save(self, mock_celery):
    """Celery 태스크는 DB 저장 후에 발행된다."""
    from interviews.models import InterviewAnalysisReport

    call_order = []
    report = InterviewAnalysisReportFactory()
    original_save = InterviewAnalysisReport.save

    with patch.object(InterviewAnalysisReport, "save") as mock_save:
      mock_save.side_effect = lambda *a, **kw: (
        call_order.append("save"),
        original_save(report, *a, **kw),
      )
      mock_celery.send_task.side_effect = lambda *a, **kw: call_order.append("celery")
      regenerate_analysis_report(report)

    self.assertEqual(call_order, ["save", "celery"])
