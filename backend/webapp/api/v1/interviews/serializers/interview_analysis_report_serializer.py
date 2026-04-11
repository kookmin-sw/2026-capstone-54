"""분석 리포트 Serializer."""

from interviews.models import InterviewAnalysisReport
from rest_framework import serializers


class InterviewAnalysisReportSerializer(serializers.ModelSerializer):

  class Meta:
    model = InterviewAnalysisReport
    fields = (
      "id",
      "interview_analysis_report_status",
      "overall_score",
      "overall_grade",
      "overall_comment",
      "category_scores",
      "question_feedbacks",
      "strengths",
      "improvement_areas",
      "error_message",
      "created_at",
      "updated_at",
    )
    read_only_fields = fields
