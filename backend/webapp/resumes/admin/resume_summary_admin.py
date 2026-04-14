"""ResumeSummary Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeSummary
from unfold.admin import ModelAdmin


@admin.register(ResumeSummary)
class ResumeSummaryAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "text_preview", "updated_at")
  list_select_related = ("resume", )
  search_fields = ("text", "resume__title")
  autocomplete_fields = ("resume", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("-updated_at", )

  @admin.display(description="요약")
  def text_preview(self, obj: ResumeSummary) -> str:
    return (obj.text or "")[:80]
