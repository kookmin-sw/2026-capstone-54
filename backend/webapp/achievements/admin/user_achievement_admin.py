from achievements.models import UserAchievement
from django.contrib import admin
from unfold.admin import ModelAdmin


@admin.register(UserAchievement)
class UserAchievementAdmin(ModelAdmin):
  list_display = ("user", "achievement", "achieved_at", "reward_claimed_at", "updated_at")
  list_filter = ("achievement__category", "reward_claimed_at")
  search_fields = ("user__email", "achievement__code", "achievement__name")
  ordering = ("-achieved_at", )
  readonly_fields = ("created_at", "updated_at")
  autocomplete_fields = ("user", "achievement")
