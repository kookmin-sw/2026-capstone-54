from django.contrib import admin
from resumes.models import ResumeTokenUsage
from unfold.admin import ModelAdmin


@admin.register(ResumeTokenUsage)
class ResumeTokenUsageAdmin(ModelAdmin):
  list_display = (
    "id",
    "user",
    "resume",
    "operation_type",
    "model_name",
    "prompt_tokens",
    "total_tokens",
    "created_at",
  )
  list_filter = (
    "operation_type",
    "model_name",
  )
  list_select_related = (
    "user",
    "resume",
  )
  search_fields = ("user__email", )
  ordering = ("-created_at", )
  autocomplete_fields = (
    "user",
    "resume",
  )

  fieldsets = (
    (None, {
      "fields": (
        "user",
        "resume",
        "operation_type",
        "model_name",
      ),
    }),
    ("토큰 사용량", {
      "fields": (
        "prompt_tokens",
        "total_tokens",
      ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )
  readonly_fields = (
    "created_at",
    "updated_at",
  )
