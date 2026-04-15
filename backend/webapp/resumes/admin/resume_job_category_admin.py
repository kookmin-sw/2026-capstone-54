"""ResumeJobCategory Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeJobCategory
from unfold.admin import ModelAdmin


@admin.register(ResumeJobCategory)
class ResumeJobCategoryAdmin(ModelAdmin):
  list_display = [
    "name",
    "emoji",
    "created_at",
    "updated_at",
  ]
  search_fields = [
    "name",
    "description",
  ]
  readonly_fields = [
    "uuid",
    "created_at",
    "updated_at",
    "deleted_at",
  ]
  ordering = [
    "name",
  ]
