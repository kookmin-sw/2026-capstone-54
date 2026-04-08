from django.contrib import admin
from interviews.models.analysis_report import AnalysisReport
from unfold.admin import ModelAdmin


@admin.register(AnalysisReport)
class AnalysisReportAdmin(ModelAdmin):
  list_display = (
    "pk",
    "session_id",
    "analysis_report_status",
    "overall_score",
    "overall_grade",
    "created_at",
  )
  list_filter = ("analysis_report_status", )
  list_select_related = ("session", )
  search_fields = ("session__user__email", )
  ordering = ("-created_at", )
  readonly_fields = ("pk", "created_at", "updated_at")

  fieldsets = (
    (None, {
      "fields": (
        "pk",
        "session",
        "analysis_report_status",
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
