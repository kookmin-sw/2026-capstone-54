"""ResumeProjectTechStack Unfold 어드민 (ResumeProject ↔ TechStack N:M 경유)."""

from django.contrib import admin
from resumes.models import ResumeProjectTechStack
from unfold.admin import ModelAdmin


@admin.register(ResumeProjectTechStack)
class ResumeProjectTechStackAdmin(ModelAdmin):
  list_display = ("uuid", "resume_project", "tech_stack", "display_order")
  list_select_related = ("resume_project", "tech_stack")
  search_fields = ("resume_project__name", "tech_stack__name")
  autocomplete_fields = ("resume_project", "tech_stack")
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume_project", "display_order")
