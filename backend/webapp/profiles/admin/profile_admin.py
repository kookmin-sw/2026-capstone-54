from django.contrib import admin
from profiles.models import Profile
from unfold.admin import ModelAdmin


@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
  list_display = ["user", "job_category", "created_at", "updated_at"]
  list_filter = ["job_category", "created_at"]
  search_fields = ["user__email", "user__name"]
  autocomplete_fields = ["user"]
  filter_horizontal = ["jobs"]
  ordering = ["-created_at"]
  readonly_fields = ["created_at", "updated_at", "deleted_at"]

  fieldsets = (
    (None, {
      "fields": ("user", "job_category")
    }),
    ("희망 직업", {
      "fields": ("jobs", )
    }),
    ("날짜", {
      "fields": ("created_at", "updated_at", "deleted_at")
    }),
  )
