"""ResumeEducation Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeEducation
from unfold.admin import ModelAdmin


@admin.register(ResumeEducation)
class ResumeEducationAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "school", "degree", "major", "period", "display_order")
  list_select_related = ("resume", )
  search_fields = ("school", "major", "resume__title")
  autocomplete_fields = ("resume", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume", "display_order")
