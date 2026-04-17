import json

from achievements.models import Achievement
from achievements.models.user_achievement import UserAchievement
from achievements.services import SeedAchievementsService
from achievements.services.evaluate_achievements_service import (
  EvaluateAchievementsService,
)
from django import forms
from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect
from django.urls import path, reverse, reverse_lazy
from django.utils.safestring import mark_safe
from django.views.generic import TemplateView
from unfold.admin import ModelAdmin
from unfold.decorators import action
from unfold.views import UnfoldModelAdminViewMixin
from unfold.widgets import UnfoldAdminEmailInputWidget, UnfoldAdminSelectMultipleWidget


class AchievementReEvaluateForm(forms.Form):
  """업적 재평가 어드민 폼."""

  TARGET_ALL = "all"
  TARGET_SPECIFIC = "specific"
  TARGET_CHOICES = [
    (TARGET_ALL, "전체 활성 유저"),
    (TARGET_SPECIFIC, "특정 유저 (이메일 입력)"),
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
    widget=UnfoldAdminEmailInputWidget,
  )
  reset_existing = forms.BooleanField(
    required=False,
    label="기존 달성 기록 초기화 후 재평가",
    help_text="체크 시 해당 유저의 기존 UserAchievement 레코드가 삭제된 뒤 재평가됩니다 (주의: 복구 불가)",
  )

  achievements = forms.ModelMultipleChoiceField(
    label="재평가할 업적",
    queryset=Achievement.objects.all().order_by("code"),
    required=False,
    widget=UnfoldAdminSelectMultipleWidget,
    help_text="비워두면 전체 업적에 대해 재평가합니다.",
  )

  def clean(self):
    cleaned = super().clean()
    if cleaned.get("target") == self.TARGET_SPECIFIC and not cleaned.get("user_email"):
      raise forms.ValidationError("특정 유저 선택 시 이메일을 입력해주세요.")
    return cleaned


class ReevaluateAchievementsView(UnfoldModelAdminViewMixin, TemplateView):
  title = "업적 재평가"
  permission_required = ()
  template_name = "admin/achievements/reevaluate_form.html"

  def get_context_data(self, **kwargs):
    context = super().get_context_data(**kwargs)
    achievement_ids = self.request.GET.get("achievement_ids", "")
    user_ids = self.request.GET.get("user_ids", "")
    achievements = Achievement.objects.none()
    if achievement_ids:
      try:
        ids = [int(v) for v in achievement_ids.split(",") if v.strip()]
        achievements = Achievement.objects.filter(id__in=ids)
      except (TypeError, ValueError):
        achievements = Achievement.objects.none()

    form = AchievementReEvaluateForm(self.request.POST or None)
    if achievements.exists():
      form.fields["achievements"].initial = list(achievements)
      form.fields["achievements"].disabled = True

    if user_ids:
      form.fields["target"].initial = AchievementReEvaluateForm.TARGET_SPECIFIC
      form.fields["target"].disabled = True

    context.update({
      "form": form,
      "achievements": achievements,
    })
    return context

  def post(self, request, *args, **kwargs):
    form = AchievementReEvaluateForm(request.POST)
    achievement_ids = request.GET.get("achievement_ids", "")
    user_ids = request.GET.get("user_ids", "")
    achievements = Achievement.objects.none()

    if achievement_ids:
      try:
        ids = [int(v) for v in achievement_ids.split(",") if v.strip()]
        achievements = Achievement.objects.filter(id__in=ids)
      except (TypeError, ValueError):
        achievements = Achievement.objects.none()

    if not form.is_valid():
      return self.get(request, *args, **kwargs)

    target = form.cleaned_data["target"]
    reset = form.cleaned_data["reset_existing"]
    selected = (list(achievements) if achievements.exists() else list(form.cleaned_data["achievements"]))

    if not selected:
      messages.error(request, "재평가할 업적을 선택해주세요.")
      return self.get(request, *args, **kwargs)

    User = get_user_model()
    if user_ids:
      try:
        ids = [int(v) for v in user_ids.split(",") if v.strip()]
        users = list(User.objects.filter(id__in=ids, is_active=True))
      except (TypeError, ValueError):
        users = []
    elif target == AchievementReEvaluateForm.TARGET_ALL:
      users = list(User.objects.filter(is_active=True))
    else:
      email = form.cleaned_data["user_email"]
      users = list(User.objects.filter(email=email, is_active=True))

    if not users:
      form.add_error("user_email", "해당 조건의 활성 유저를 찾을 수 없습니다.")
      return self.get(request, *args, **kwargs)

    deleted_count = 0
    if reset:
      deleted_count, _ = UserAchievement.objects.filter(
        achievement__in=selected,
        user__in=users,
      ).delete()

    total_new = 0
    for user in users:
      result = EvaluateAchievementsService(user=user).perform()
      total_new += len(result) if result else 0

    reset_msg = f", 초기화 {deleted_count}건" if reset else ""
    messages.success(
      request,
      f"{len(users)}명 재평가 완료. 신규 달성: {total_new}건{reset_msg}",
    )
    return HttpResponseRedirect(reverse("admin:achievements_achievement_changelist"))


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
  actions_list = [
    "seed_default_achievements",
    "open_reevaluate_form",
  ]
  actions = [
    "check_achievement_status",
    "reevaluate_selected_achievements",
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

  # ------------------------------------------------------------------ #
  # Unfold actions_list 버튼                                            #
  # ------------------------------------------------------------------ #

  @action(description="기본 업적 데이터 생성", url_path="seed-achievements")
  def seed_default_achievements(self, request: HttpRequest) -> HttpResponse:
    """기본 업적 시드 데이터를 생성한다."""
    result = SeedAchievementsService.seed()
    self.message_user(
      request,
      f"업적 생성: {result['created']}개, 이미 존재: {result['skipped']}개",
    )
    return redirect(reverse_lazy("admin:achievements_achievement_changelist"))

  def has_seed_default_achievements_permission(self, request: HttpRequest) -> bool:
    return request.user.is_superuser

  @action(description="업적 재평가 (폼)", url_path="reevaluate-form")
  def open_reevaluate_form(self, request: HttpRequest) -> HttpResponse:
    return HttpResponseRedirect(reverse("admin:achievements_achievement_reevaluate_form"))

  @admin.action(description="선택된 업적 재평가 (폼)")
  def reevaluate_selected_achievements(self, request, queryset):
    if not queryset.exists():
      messages.error(request, "재평가할 업적이 선택되지 않았습니다.")
      return HttpResponseRedirect(request.get_full_path())
    achievement_ids = list(queryset.values_list("id", flat=True))
    query = ",".join(map(str, achievement_ids))
    url = reverse("admin:achievements_achievement_reevaluate_form")
    return HttpResponseRedirect(f"{url}?achievement_ids={query}")

  # ------------------------------------------------------------------ #
  # 표준 Django actions (항목 선택 드롭다운)                             #
  # ------------------------------------------------------------------ #

  @admin.action(description="선택된 업적 달성 현황 확인")
  def check_achievement_status(self, request, queryset):
    """선택된 업적들의 달성 및 보상 수령 현황을 요약해서 출력한다."""
    lines = []
    for achievement in queryset:
      total_achieved = UserAchievement.objects.filter(achievement=achievement).count()
      total_claimed = UserAchievement.objects.filter(
        achievement=achievement,
        reward_claimed_at__isnull=False,
      ).count()
      lines.append(f"[{achievement.code}] 달성: {total_achieved}명, 보상 수령: {total_claimed}명")

    self.message_user(request, " | ".join(lines), messages.INFO)

  def get_urls(self):
    urls = super().get_urls()
    custom_urls = [
      path(
        "reevaluate-form/",
        ReevaluateAchievementsView.as_view(model_admin=self),
        name="achievements_achievement_reevaluate_form",
      ),
    ]
    return custom_urls + urls
