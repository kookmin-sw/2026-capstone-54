"""ResumeIndustryDomain Unfold 어드민 (Resume ↔ IndustryDomain N:M 경유)."""

from django.contrib import admin
from resumes.models import ResumeIndustryDomain
from unfold.admin import ModelAdmin


@admin.register(ResumeIndustryDomain)
class ResumeIndustryDomainAdmin(ModelAdmin):
  list_display = ("uuid", "resume", "industry_domain", "display_order")
  list_select_related = ("resume", "industry_domain")
  search_fields = ("resume__title", "industry_domain__name")
  autocomplete_fields = ("resume", "industry_domain")
  readonly_fields = ("uuid", "created_at", "updated_at")
  ordering = ("resume", "display_order")
