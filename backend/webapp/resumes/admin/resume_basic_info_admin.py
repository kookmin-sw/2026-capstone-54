"""ResumeBasicInfo Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeBasicInfo
from unfold.admin import ModelAdmin


@admin.register(ResumeBasicInfo)
class ResumeBasicInfoAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "name", "email", "phone", "location", "updated_at")
  list_select_related = ("resume", )
  search_fields = ("name", "email", "phone", "location", "resume__title")
  autocomplete_fields = ("resume", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("-updated_at", )
