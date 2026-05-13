"""ResumeSkill Unfold 어드민 (Resume ↔ Skill N:M 경유)."""

from django.contrib import admin
from resumes.models import ResumeSkill
from unfold.admin import ModelAdmin


@admin.register(ResumeSkill)
class ResumeSkillAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "skill", "display_order")
  list_select_related = ("resume", "skill")
  list_filter = ("skill__skill_type", )
  search_fields = ("resume__title", "skill__name")
  autocomplete_fields = ("resume", "skill")
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume", "display_order")
