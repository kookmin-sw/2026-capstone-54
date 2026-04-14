"""ResumeKeyword Unfold 어드민 (Resume ↔ Keyword N:M 경유)."""

from django.contrib import admin
from resumes.models import ResumeKeyword
from unfold.admin import ModelAdmin


@admin.register(ResumeKeyword)
class ResumeKeywordAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "keyword", "display_order")
  list_select_related = ("resume", "keyword")
  search_fields = ("resume__title", "keyword__text")
  autocomplete_fields = ("resume", "keyword")
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume", "display_order")
