from django.contrib import admin
from streaks.models import StreakStatistics
from unfold.admin import ModelAdmin


@admin.register(StreakStatistics)
class StreakStatisticsAdmin(ModelAdmin):
  list_display = (
    "user",
    "current_streak",
    "longest_streak",
    "last_participated_date",
    "updated_at",
  )
  list_filter = ("last_participated_date", )
  search_fields = ("user__email", )
  ordering = ("-current_streak", )
  readonly_fields = (
    "created_at",
    "updated_at",
  )
  raw_id_fields = ("user", )
