"""ResumeExperience Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeExperience
from unfold.admin import ModelAdmin


@admin.register(ResumeExperience)
class ResumeExperienceAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "company", "role", "period", "display_order", "updated_at")
  list_select_related = ("resume", )
  list_filter = ("company", )
  search_fields = ("company", "role", "resume__title")
  autocomplete_fields = ("resume", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume", "display_order")
