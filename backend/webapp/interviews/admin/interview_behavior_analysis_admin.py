from django.contrib import admin
from interviews.models.interview_behavior_analysis import InterviewBehaviorAnalysis
from unfold.admin import ModelAdmin


@admin.register(InterviewBehaviorAnalysis)
class InterviewBehaviorAnalysisAdmin(ModelAdmin):
  list_display = (
    "pk",
    "user__email",
    "status",
    "has_expression_data",
    "has_speech_data",
    "created_at",
  )
  list_filter = ("status", )
  list_select_related = (
    "user",
    "interview_session",
    "interview_turn",
    "interview_recording",
  )
  search_fields = ("user__email", )
  ordering = ("-created_at", )
  readonly_fields = (
    "pk",
    "created_at",
    "updated_at",
    "has_expression_data",
    "has_speech_data",
  )

  fieldsets = (
    (
      None,
      {
        "fields": (
          "pk",
          "user",
          "interview_session",
          "interview_turn",
          "interview_recording",
        ),
      },
    ),
    (
      "상태",
      {
        "fields": ("status", ),
      },
    ),
    (
      "분석 데이터",
      {
        "fields": (
          "has_expression_data",
          "has_speech_data",
          "expression_data",
          "speech_data",
        ),
      },
    ),
    (
      "날짜",
      {
        "fields": (
          "created_at",
          "updated_at",
        ),
      },
    ),
  )

  @admin.display(boolean=True, description="표정 데이터")
  def has_expression_data(self, obj):
    return bool(obj.expression_data)

  @admin.display(boolean=True, description="음성 데이터")
  def has_speech_data(self, obj):
    return bool(obj.speech_data)
