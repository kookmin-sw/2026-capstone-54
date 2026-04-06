from django.contrib import admin
from resumes.models import FileResume, ResumeFileContent
from unfold.admin import ModelAdmin, TabularInline


class ResumeFileContentInline(TabularInline):
  model = ResumeFileContent
  extra = 0
  readonly_fields = ("created_at", )


@admin.register(FileResume)
class FileResumeAdmin(ModelAdmin):
  list_display = (
    "uuid",
    "user",
    "title",
    "analysis_status",
    "analysis_step",
    "is_active",
    "created_at",
  )
  list_filter = (
    "analysis_status",
    "analysis_step",
    "is_active",
  )
  list_select_related = ("user", )
  search_fields = (
    "title",
    "user__email",
  )
  ordering = ("-created_at", )
  autocomplete_fields = ("user", )
  inlines = [ResumeFileContentInline]

  fieldsets = (
    (None, {
      "fields": (
        "user",
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
