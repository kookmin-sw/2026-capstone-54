from django.contrib import admin
from interviews.models import InterviewAnalysisReport
from unfold.admin import ModelAdmin


@admin.register(InterviewAnalysisReport)
class InterviewAnalysisReportAdmin(ModelAdmin):
  list_display = (
    "pk",
    "interview_session_id",
    "interview_analysis_report_status",
    "overall_score",
    "overall_grade",
    "created_at",
  )
  list_filter = ("interview_analysis_report_status", )
  list_select_related = ("interview_session", )
  search_fields = ("interview_session__user__email", )
  ordering = ("-created_at", )
  readonly_fields = ("pk", "created_at", "updated_at")

  fieldsets = (
    (None, {
      "fields": (
        "pk",
        "interview_session",
        "interview_analysis_report_status",
        "error_message",
      ),
    }),
    ("종합 평가", {
      "fields": (
        "overall_score",
        "overall_grade",
        "overall_comment",
      ),
    }),
    ("상세 분석", {
      "fields": (
        "category_scores",
        "question_feedbacks",
        "strengths",
        "improvement_areas",
      ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )
