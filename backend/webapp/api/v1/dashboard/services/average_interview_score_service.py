from common.services import BaseQueryService
from django.db.models import Avg, Count
from interviews.enums import InterviewAnalysisReportStatus
from interviews.models import InterviewAnalysisReport


class AverageInterviewScoreService(BaseQueryService):
  required_value_kwargs: list[str] = []

  def execute(self) -> dict:
    aggregated = InterviewAnalysisReport.objects.filter(
      interview_session__user=self.user,
      interview_analysis_report_status=InterviewAnalysisReportStatus.COMPLETED,
      overall_score__isnull=False,
    ).aggregate(
      average=Avg("overall_score"),
      sample_size=Count("pk"),
    )

    average = aggregated["average"]
    return {
      "average_score": round(average, 1) if average is not None else None,
      "sample_size": aggregated["sample_size"] or 0,
    }
