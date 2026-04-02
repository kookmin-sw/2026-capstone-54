from django.contrib import admin
from streaks.models import StreakLog
from unfold.admin import ModelAdmin


@admin.register(StreakLog)
class StreakLogAdmin(ModelAdmin):
  list_display = (
    "user",
    "date",
    "interview_results_count",
    "created_at",
  )
  list_filter = ("date", )
  search_fields = ("user__email", )
  ordering = ("-date", )
  readonly_fields = (
    "created_at",
    "updated_at",
  )
  autocomplete_fields = ("user", )
