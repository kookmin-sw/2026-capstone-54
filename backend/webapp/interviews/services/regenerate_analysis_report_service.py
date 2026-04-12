"""분석 리포트 재생성 서비스."""

from celery import current_app
from interviews.enums import InterviewAnalysisReportStatus
from interviews.models import InterviewAnalysisReport


def regenerate_analysis_report(report: InterviewAnalysisReport) -> None:
  """리포트를 pending 상태로 초기화하고 Celery 재생성 태스크를 발행한다."""
  report.interview_analysis_report_status = InterviewAnalysisReportStatus.PENDING
  report.error_message = ""
  report.overall_score = None
  report.overall_grade = ""
  report.overall_comment = ""
  report.category_scores = []
  report.question_feedbacks = []
  report.strengths = []
  report.improvement_areas = []
  report.save(
    update_fields=[
      "interview_analysis_report_status",
      "error_message",
      "overall_score",
      "overall_grade",
      "overall_comment",
      "category_scores",
      "question_feedbacks",
      "strengths",
      "improvement_areas",
      "updated_at",
    ]
  )
  current_app.send_task(
    "analysis.tasks.generate_report.generate_analysis_report",
    args=[report.pk],
    queue="analysis",
  )
