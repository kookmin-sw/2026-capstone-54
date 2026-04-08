from django.contrib import admin
from interviews.models.interview_turn import InterviewTurn
from unfold.admin import ModelAdmin


@admin.register(InterviewTurn)
class InterviewTurnAdmin(ModelAdmin):
  list_display = (
    "pk",
    "session_id",
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
  list_select_related = ("session", )
  search_fields = ("question", "session__user__email")
  ordering = ("-created_at", )
  readonly_fields = ("pk", "created_at", "updated_at")

  fieldsets = (
    (None, {
      "fields": (
        "pk",
        "session",
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
