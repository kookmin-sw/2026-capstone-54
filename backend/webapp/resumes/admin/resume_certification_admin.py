"""ResumeCertification Unfold 어드민."""

from django.contrib import admin
from resumes.models import ResumeCertification
from unfold.admin import ModelAdmin


@admin.register(ResumeCertification)
class ResumeCertificationAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "name", "issuer", "date", "display_order")
  list_select_related = ("resume", )
  search_fields = ("name", "issuer", "resume__title")
  autocomplete_fields = ("resume", )
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume", "display_order")
