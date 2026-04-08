from django.contrib import admin
from interviews.models.interview_turn import InterviewTurn
from unfold.admin import ModelAdmin


@admin.register(InterviewTurn)
class InterviewTurnAdmin(ModelAdmin):
  list_display = (
    "pk",
    "interview_session_id",
    "turn_type",
    "question_source",
    "turn_number",
    "has_answer",
    "created_at",
  )
  list_filter = (
    "turn_type",
    "question_source",
  )
  list_select_related = ("interview_session", )
  search_fields = ("question", "interview_session__user__email")
  ordering = ("-created_at", )
  readonly_fields = ("pk", "created_at", "updated_at")

  fieldsets = (
    (None, {
      "fields": (
        "pk",
        "interview_session",
        "turn_type",
        "question_source",
        "turn_number",
      ),
    }),
    ("내용", {
      "fields": (
        "question",
        "answer",
      ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )

  @admin.display(boolean=True, description="답변 여부")
  def has_answer(self, obj: InterviewTurn) -> bool:
    return bool(obj.answer)
