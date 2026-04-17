import json

from achievements.models import Achievement
from achievements.services import SeedAchievementsService
from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.utils.safestring import mark_safe
from unfold.admin import ModelAdmin
from unfold.decorators import action


@admin.register(Achievement)
class AchievementAdmin(ModelAdmin):
  list_display = ("code", "name", "category", "is_active", "starts_at", "ends_at", "updated_at")
  list_filter = ("category", "is_active")
  search_fields = ("code", "name")
  ordering = ("category", "code")
  readonly_fields = ("created_at", "updated_at", "condition_payload_pretty", "reward_payload_pretty")
  actions_list = ["seed_default_achievements"]
  fieldsets = (
    (
      None, {
        "fields": (
          "code",
          "name",
          "description",
          "category",
          "condition_type",
          "condition_schema_version",
          "condition_payload",
          "condition_payload_pretty",
          "reward_payload",
          "reward_payload_pretty",
          "is_active",
          "starts_at",
          "ends_at",
        ),
      }
    ),
    ("날짜", {
      "fields": ("created_at", "updated_at")
    }),
  )

  def condition_payload_pretty(self, obj):
    return mark_safe(f"<pre>{json.dumps(obj.condition_payload or {}, ensure_ascii=False, indent=2)}</pre>")

  condition_payload_pretty.short_description = "조건 JSON (보기 전용)"

  def reward_payload_pretty(self, obj):
    return mark_safe(f"<pre>{json.dumps(obj.reward_payload or {}, ensure_ascii=False, indent=2)}</pre>")

  reward_payload_pretty.short_description = "보상 JSON (보기 전용)"

  @action(description="기본 업적 데이터 생성", url_path="seed-achievements")
  def seed_default_achievements(self, request: HttpRequest):
    """기본 업적 시드 데이터를 생성한다."""
    result = SeedAchievementsService.seed()
    self.message_user(
      request,
      f"업적 생성: {result['created']}개, 이미 존재: {result['skipped']}개",
    )
    return redirect(reverse_lazy("admin:achievements_achievement_changelist"))

  def has_seed_default_achievements_permission(self, request: HttpRequest):
    return request.user.is_superuser
