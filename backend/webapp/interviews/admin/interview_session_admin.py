from django.contrib import admin
from interviews.models.interview_session import InterviewSession
from unfold.admin import ModelAdmin


@admin.register(InterviewSession)
class InterviewSessionAdmin(ModelAdmin):
  list_display = (
    "pk",
    "user__email",
    "session_type",
    "session_status",
    "difficulty_level",
    "total_questions",
    "total_followup_questions",
    "created_at",
  )
  list_filter = (
    "session_type",
    "session_status",
    "difficulty_level",
  )
  list_select_related = ("user", "resume", "user_job_description")
  search_fields = ("user__email", )
  ordering = ("-created_at", )
  readonly_fields = ("pk", "created_at", "updated_at")

  fieldsets = (
    (None, {
      "fields": (
        "pk",
        "user",
        "resume",
        "user_job_description",
      ),
    }),
    ("세션 설정", {
      "fields": (
        "session_type",
        "session_status",
        "difficulty_level",
      ),
    }),
    ("통계", {
      "fields": (
        "total_questions",
        "total_followup_questions",
      ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )
