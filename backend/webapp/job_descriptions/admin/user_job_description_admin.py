from django.contrib import admin
from job_descriptions.models import UserJobDescription
from unfold.admin import ModelAdmin


@admin.register(UserJobDescription)
class UserJobDescriptionAdmin(ModelAdmin):
  list_display = (
    "uuid",
    "user",
    "job_description",
    "created_at",
  )
  list_filter = ("created_at", )
  list_select_related = (
    "user",
    "job_description",
  )
  search_fields = (
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
      ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )
