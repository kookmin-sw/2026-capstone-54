"""ResumeAward Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeAward
from unfold.admin import ModelAdmin


@admin.register(ResumeAward)
class ResumeAwardAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "name", "year", "organization", "display_order")
  list_select_related = ("resume", )
  search_fields = ("name", "organization", "resume__title")
  autocomplete_fields = ("resume", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume", "display_order")
