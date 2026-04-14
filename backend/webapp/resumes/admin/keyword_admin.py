"""Keyword Unfold 어드민 (공용 참조 테이블)."""

from django.contrib import admin
from resumes.models import Keyword
from unfold.admin import ModelAdmin


@admin.register(Keyword)
class KeywordAdmin(ModelAdmin):
  list_display = ("uuid", "text", "created_at")
  search_fields = ("text", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("text", )
