"""ResumeProject Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeProject
from unfold.admin import ModelAdmin


@admin.register(ResumeProject)
class ResumeProjectAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "name", "role", "period", "display_order")
  list_select_related = ("resume", )
  search_fields = ("name", "role", "resume__title")
  autocomplete_fields = ("resume", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume", "display_order")
