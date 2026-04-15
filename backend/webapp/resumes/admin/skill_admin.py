"""Skill Unfold 어드민 (공용 참조 테이블)."""

from django.contrib import admin
from resumes.models import Skill
from unfold.admin import ModelAdmin


@admin.register(Skill)
class SkillAdmin(ModelAdmin):
  list_display = ("uuid", "name", "skill_type", "created_at")
  list_filter = ("skill_type", )
  search_fields = ("name", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("skill_type", "name")
