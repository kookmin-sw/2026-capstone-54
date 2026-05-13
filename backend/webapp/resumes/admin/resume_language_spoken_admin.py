"""ResumeLanguageSpoken Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeLanguageSpoken
from unfold.admin import ModelAdmin


@admin.register(ResumeLanguageSpoken)
class ResumeLanguageSpokenAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "language", "level", "display_order")
  list_select_related = ("resume", )
  list_filter = ("language", )
  search_fields = ("language", "level", "resume__title")
  autocomplete_fields = ("resume", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume", "display_order")
