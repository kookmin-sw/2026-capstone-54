from django.contrib import admin
from resumes.models import ResumeTextContent
from unfold.admin import ModelAdmin


@admin.register(ResumeTextContent)
class ResumeTextContentAdmin(ModelAdmin):
  list_display = (
    "id",
    "resume",
    "user",
    "created_at",
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
        "content",
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
