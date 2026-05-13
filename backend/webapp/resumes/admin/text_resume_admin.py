from django.contrib import admin
from resumes.models import ResumeTextContent, TextResume
from unfold.admin import ModelAdmin, TabularInline


class ResumeTextContentInline(TabularInline):
  model = ResumeTextContent
  extra = 0
  readonly_fields = ("created_at", "updated_at")


@admin.register(TextResume)
class TextResumeAdmin(ModelAdmin):
  list_display = (
    "uuid",
    "user__email",
    "title",
    "analysis_status",
    "analysis_step",
    "created_at",
  )
  list_filter = (
    "analysis_status",
    "analysis_step",
  )
  search_fields = (
    "title",
    "user__email",
  )
  list_select_related = ("user", )
  ordering = ("-created_at", )
  autocomplete_fields = ("user", )
  inlines = [ResumeTextContentInline]

  fieldsets = (
    (None, {
      "fields": ("user", "title"),
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
