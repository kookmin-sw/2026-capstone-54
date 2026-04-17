from achievements.models import UserAchievement
from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.urls import reverse
from unfold.admin import ModelAdmin


@admin.register(UserAchievement)
class UserAchievementAdmin(ModelAdmin):
  list_display = (
    "user",
    "achievement",
    "achieved_at",
    "reward_claimed_at",
    "updated_at",
  )
  list_filter = ("achievement__category", "reward_claimed_at")
  search_fields = ("user__email", "achievement__code", "achievement__name")
  ordering = ("-achieved_at", )
  readonly_fields = ("created_at", "updated_at")
  autocomplete_fields = ("user", "achievement")
  actions = ["reevaluate_selected_users"]

  @admin.action(description="선택된 사용자 업적 재평가 (폼)")
  def reevaluate_selected_users(self, request, queryset):
    if not queryset.exists():
      messages.error(request, "재평가할 사용자가 선택되지 않았습니다.")
      return HttpResponseRedirect(request.get_full_path())

    user_ids = list({ua.user_id for ua in queryset})
    user_ids_str = ",".join(map(str, user_ids))
    url = reverse("admin:achievements_achievement_reevaluate_form")
    return HttpResponseRedirect(f"{url}?user_ids={user_ids_str}")
