import json

from achievements.models import Achievement
from achievements.services import SeedAchievementsService
from django import forms
from django.contrib import admin, messages
from django.http import HttpRequest
from django.shortcuts import redirect, render
from django.urls import path, reverse_lazy
from django.utils.safestring import mark_safe
from unfold.admin import ModelAdmin
from unfold.decorators import action


class AchievementReEvaluateForm(forms.Form):
  """업적 재평가 어드민 폼."""

  TARGET_ALL = "all"
  TARGET_SPECIFIC = "specific"
  TARGET_CHOICES = [
    (TARGET_ALL, "전체 활성 유저"),
    (TARGET_SPECIFIC, "특정 유저"),
  ]

  target = forms.ChoiceField(
    choices=TARGET_CHOICES,
    label="평가 대상",
    widget=forms.RadioSelect,
    initial=TARGET_ALL,
  )
  user_email = forms.EmailField(
    required=False,
    label="유저 이메일",
    help_text="특정 유저 선택 시 입력하세요",
  )
  reset_existing = forms.BooleanField(
    required=False,
    label="기존 달성 기록 초기화",
    help_text="체크 시 선택된 업적의 기존 UserAchievement 레코드가 삭제됩니다",
  )

  def clean(self):
    cleaned = super().clean()
    if cleaned.get("target") == self.TARGET_SPECIFIC and not cleaned.get("user_email"):
      raise forms.ValidationError("특정 유저 선택 시 이메일을 입력해주세요.")
    return cleaned


@admin.register(Achievement)
class AchievementAdmin(ModelAdmin):
  list_display = (
    "code",
    "name",
    "category",
    "is_active",
    "starts_at",
    "ends_at",
    "updated_at",
  )
  list_filter = ("category", "is_active")
  search_fields = ("code", "name")
  ordering = ("category", "code")
  readonly_fields = (
    "created_at",
    "updated_at",
    "condition_payload_pretty",
    "reward_payload_pretty",
  )
  actions_list = ["seed_default_achievements"]
  actions = [
    "reevaluate_all_users",
    "reevaluate_with_form",
    "check_achievement_status",
  ]
  fieldsets = (
    (
      None,
      {
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
      },
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

  @admin.action(description="선택된 업적에 대해 전체 활성 유저 재평가 실행")
  def reevaluate_all_users(self, request, queryset):
    """전체 활성 유저에 대해 업적 조건을 재평가하고 누락된 달성 이력을 생성한다."""
    from achievements.services.evaluate_achievements_service import (
      EvaluateAchievementsService,
    )
    from django.contrib.auth import get_user_model

    User = get_user_model()
    users = User.objects.filter(is_active=True)
    total_new = 0

    for user in users:
      result = EvaluateAchievementsService(user=user).perform()
      total_new += len(result) if result else 0

    self.message_user(
      request,
      f"{users.count()}명 유저 재평가 완료. 신규 달성 업적: {total_new}건",
      messages.SUCCESS,
    )

  @admin.action(description="선택된 업적 재평가 (폼 — 대상 유저 선택 및 초기화 옵션)")
  def reevaluate_with_form(self, request, queryset):
    """선택된 업적 ID를 세션에 저장한 뒤 중간 폼 페이지로 리다이렉트한다."""
    selected_ids = list(queryset.values_list("id", flat=True))
    request.session["reevaluate_achievement_ids"] = selected_ids
    return redirect(reverse_lazy("admin:achievements_reevaluate_form"))

  @admin.action(description="선택된 업적 달성 현황 확인")
  def check_achievement_status(self, request, queryset):
    """선택된 업적들의 달성 및 보상 수령 현황을 요약해서 출력한다."""
    from achievements.models import UserAchievement

    lines = []
    for achievement in queryset:
      total_achieved = UserAchievement.objects.filter(achievement=achievement).count()
      total_claimed = UserAchievement.objects.filter(
        achievement=achievement,
        reward_claimed_at__isnull=False,
      ).count()
      lines.append(f"[{achievement.code}] 달성: {total_achieved}명, 보상 수령: {total_claimed}명")

    self.message_user(request, " | ".join(lines), messages.INFO)

  # ------------------------------------------------------------------ #
  # 커스텀 URL / 중간 폼 뷰                                              #
  # ------------------------------------------------------------------ #

  def get_urls(self):
    urls = super().get_urls()
    custom_urls = [
      path(
        "reevaluate-form/",
        self.admin_site.admin_view(self.reevaluate_form_view),
        name="achievements_reevaluate_form",
      ),
    ]
    return custom_urls + urls

  def reevaluate_form_view(self, request):
    """선택된 업적에 대한 재평가 옵션을 받아 실행하는 중간 폼 뷰."""
    achievement_ids = request.session.get("reevaluate_achievement_ids", [])
    achievements = Achievement.objects.filter(id__in=achievement_ids)

    if not achievements.exists():
      self.message_user(request, "재평가할 업적이 선택되지 않았습니다.", messages.WARNING)
      return redirect(reverse_lazy("admin:achievements_achievement_changelist"))

    if request.method == "POST":
      form = AchievementReEvaluateForm(request.POST)
      if form.is_valid():
        return self._execute_reevaluate(request, form, achievements)
    else:
      form = AchievementReEvaluateForm()

    context = {
      **self.admin_site.each_context(request),
      "form": form,
      "achievements": achievements,
      "title": "업적 재평가",
      "opts": self.model._meta,
    }
    return render(request, "admin/achievements/reevaluate_form.html", context)

  def _execute_reevaluate(self, request, form, achievements):
    """폼 데이터를 바탕으로 재평가를 실행하고 결과를 메시지로 출력한다."""
    from achievements.models import UserAchievement
    from achievements.services.evaluate_achievements_service import (
      EvaluateAchievementsService,
    )
    from django.contrib.auth import get_user_model

    User = get_user_model()
    target = form.cleaned_data["target"]
    reset = form.cleaned_data["reset_existing"]

    if target == AchievementReEvaluateForm.TARGET_ALL:
      users = User.objects.filter(is_active=True)
    else:
      email = form.cleaned_data["user_email"]
      users = User.objects.filter(email=email, is_active=True)
      if not users.exists():
        form.add_error("user_email", "해당 이메일의 활성 유저를 찾을 수 없습니다.")
        context = {
          **self.admin_site.each_context(request),
          "form": form,
          "achievements": achievements,
          "title": "업적 재평가",
          "opts": self.model._meta,
        }
        return render(request, "admin/achievements/reevaluate_form.html", context)

    deleted_count = 0
    if reset:
      deleted_count, _ = UserAchievement.objects.filter(
        achievement__in=achievements,
        user__in=users,
      ).delete()

    total_new = 0
    for user in users:
      result = EvaluateAchievementsService(user=user).perform()
      total_new += len(result) if result else 0

    reset_msg = f", 초기화 {deleted_count}건" if reset else ""
    self.message_user(
      request,
      f"{users.count()}명 재평가 완료. 신규 달성: {total_new}건{reset_msg}",
      messages.SUCCESS,
    )
    request.session.pop("reevaluate_achievement_ids", None)
    return redirect(reverse_lazy("admin:achievements_achievement_changelist"))
