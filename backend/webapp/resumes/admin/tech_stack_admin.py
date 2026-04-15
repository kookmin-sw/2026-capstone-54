"""TechStack Unfold 어드민 (공용 참조 테이블)."""

from django.contrib import admin
from resumes.models import TechStack
from unfold.admin import ModelAdmin


@admin.register(TechStack)
class TechStackAdmin(ModelAdmin):
  list_display = ("uuid", "name", "created_at")
  search_fields = ("name", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("name", )
