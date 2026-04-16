from django.contrib import admin
from job_descriptions.models import UserJobDescription
from unfold.admin import ModelAdmin


@admin.register(UserJobDescription)
class UserJobDescriptionAdmin(ModelAdmin):
  list_display = (
    "uuid",
    "user",
    "title",
    "job_description",
    "application_status",
    "created_at",
  )
  list_filter = (
    "application_status",
    "created_at",
  )
  list_select_related = (
    "user",
    "job_description",
  )
  search_fields = (
    "title",
    "user__email",
    "job_description__title",
    "job_description__company",
  )
  ordering = ("-created_at", )
  autocomplete_fields = (
    "user",
    "job_description",
  )
  readonly_fields = (
    "created_at",
    "updated_at",
  )

  fieldsets = (
    (None, {
      "fields": (
        "user",
        "job_description",
        "title",
        "application_status",
      ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )
