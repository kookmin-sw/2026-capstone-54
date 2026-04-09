from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from interviews.models import InterviewAnalysisReport
from interviews.services import regenerate_analysis_report
from unfold.admin import ModelAdmin
from unfold.decorators import action


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
  actions = ["bulk_regenerate_reports"]
  actions_row = ["regenerate_report"]

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

  @admin.action(description="선택한 리포트 재생성")
  def bulk_regenerate_reports(self, request: HttpRequest, queryset):
    for report in queryset:
      regenerate_analysis_report(report)
    self.message_user(request, f"{queryset.count()}개 리포트 재생성 태스크가 발행되었습니다.")

  @action(description="리포트 재생성", url_path="regenerate")
  def regenerate_report(self, request: HttpRequest, object_id: int):
    report = InterviewAnalysisReport.objects.get(pk=object_id)
    regenerate_analysis_report(report)
    self.message_user(request, f"리포트 #{object_id} 재생성 태스크가 발행되었습니다.")
    return redirect(reverse_lazy("admin:interviews_interviewanalysisreport_changelist"))

  def has_regenerate_report_permission(self, request: HttpRequest) -> bool:
    return request.user.is_staff
