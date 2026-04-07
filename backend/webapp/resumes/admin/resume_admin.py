from django.contrib import admin
from resumes.models import Resume
from unfold.admin import ModelAdmin


@admin.register(Resume)
class ResumeAdmin(ModelAdmin):
  list_display = (
    "uuid",
    "user",
    "type",
    "title",
    "analysis_status",
    "analysis_step",
    "is_active",
    "created_at",
  )
  list_filter = (
    "type",
    "analysis_status",
    "analysis_step",
    "is_active",
  )
  list_select_related = ("user", )
  search_fields = ("title", "user__email")
  ordering = ("-created_at", )
  autocomplete_fields = ("user", )

  fieldsets = (
    (None, {
      "fields": (
        "user",
        "type",
        "title",
      ),
    }),
    ("분석 상태", {
      "fields": (
        "analysis_status",
        "analysis_step",
        "is_parsed",
        "parsed_data",
        "analyzed_at",
      ),
    }),
    ("활성화", {
      "fields": ("is_active", ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
        "deleted_at",
      ),
    }),
  )
  readonly_fields = (
    "analyzed_at",
    "created_at",
    "updated_at",
    "deleted_at",
  )
