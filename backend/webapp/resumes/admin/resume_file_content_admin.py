from django.contrib import admin
from resumes.models import ResumeFileContent
from unfold.admin import ModelAdmin


@admin.register(ResumeFileContent)
class ResumeFileContentAdmin(ModelAdmin):
  list_display = (
    "id",
    "resume",
    "original_filename",
    "mime_type",
    "file_size_bytes",
    "created_at",
  )
  list_select_related = ("resume", )
  search_fields = (
    "original_filename",
    "user__email",
  )
  ordering = ("-created_at", )
  autocomplete_fields = ("user", "resume")

  fieldsets = (
    (None, {
      "fields": (
        "user",
        "resume",
        "original_filename",
        "storage_path",
      ),
    }),
    ("파일 정보", {
      "fields": (
        "file_size_bytes",
        "mime_type",
        "content",
      ),
    }),
    ("날짜", {
      "fields": ("created_at", ),
    }),
  )
  readonly_fields = ("created_at", )
