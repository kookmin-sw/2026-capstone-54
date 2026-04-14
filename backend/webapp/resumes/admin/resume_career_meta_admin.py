"""ResumeCareerMeta Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeCareerMeta
from unfold.admin import ModelAdmin


@admin.register(ResumeCareerMeta)
class ResumeCareerMetaAdmin(ModelAdmin):
  list_display = (
    "uuid",
    "resume",
    "total_experience_years",
    "total_experience_months",
    "updated_at",
  )
  list_select_related = ("resume", )
  search_fields = ("resume__title", )
  autocomplete_fields = ("resume", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("-updated_at", )
