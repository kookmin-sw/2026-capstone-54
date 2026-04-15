from django.contrib import admin
from job_descriptions.models import JobDescription
from unfold.admin import ModelAdmin


@admin.register(JobDescription)
class JobDescriptionAdmin(ModelAdmin):
  list_display = (
    "id",
    "company",
    "title",
    "platform",
    "collection_status",
    "scraped_at",
    "created_at",
  )
  list_filter = (
    "collection_status",
    "platform",
  )
  search_fields = (
    "title",
    "company",
    "url",
  )
  ordering = ("-created_at", )

  fieldsets = (
    (None, {
      "fields": (
        "url",
        "platform",
        "company",
        "title",
      ),
    }),
    ("공고 본문", {
      "fields": (
        "duties",
        "requirements",
        "preferred",
      ),
    }),
    ("근무 조건", {
      "fields": (
        "work_type",
        "salary",
        "location",
        "education",
        "experience",
      ),
    }),
    ("수집 상태", {
      "fields": (
        "collection_status",
        "scraped_at",
        "error_message",
      ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )
  readonly_fields = (
    "scraped_at",
    "created_at",
    "updated_at",
  )
