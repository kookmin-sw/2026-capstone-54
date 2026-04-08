from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from streaks.models import StreakStatistics
from streaks.services import RecalculateStreakStatisticsService
from unfold.admin import ModelAdmin
from unfold.decorators import action
from unfold.widgets import UnfoldAdminSelectMultipleWidget

User = get_user_model()


class RecalculateStatisticsForm(forms.Form):
  """스트릭 통계 재계산 폼"""

  users = forms.ModelMultipleChoiceField(
    label="사용자 선택",
    queryset=User.objects.all().order_by("email"),
    required=True,
    widget=UnfoldAdminSelectMultipleWidget,
    help_text="통계를 재계산할 사용자를 선택하세요. StreakStatistics가 없는 사용자는 자동으로 생성됩니다.",
  )


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
  autocomplete_fields = ("user", )
  actions = ["recalculate_selected_statistics"]
  actions_list = ["recalculate_multiple_statistics"]
  actions_row = ["recalculate_statistics"]

  # Django 기본 actions (checkbox 선택)
  @admin.action(description="선택한 사용자 통계 재계산")
  def recalculate_selected_statistics(self, request, queryset):
    """선택한 사용자들의 스트릭 통계를 재계산한다"""
    user_ids = list(queryset.values_list("user_id", flat=True))

    result = RecalculateStreakStatisticsService(user_ids=user_ids).perform()

    message = f"{result['success_count']}명의 사용자에 대해 스트릭 통계가 재계산되었습니다."
    if result["error_count"] > 0:
      message += f" ({result['error_count']}명 실패)"

    self.message_user(request, message)

  # Unfold changelist action (폼 사용)
  @action(description="통계 재계산 (다중)", url_path="recalculate-multiple")
  def recalculate_multiple_statistics(self, request: HttpRequest) -> HttpResponse:
    """사용자를 선택하여 스트릭 통계를 재계산한다"""
    form = RecalculateStatisticsForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
      selected_users = form.cleaned_data["users"]

      # User 객체를 직접 전달하여 중복 조회 방지
      result = RecalculateStreakStatisticsService(users=list(selected_users)).perform()

      message = f"{result['success_count']}명의 사용자에 대해 스트릭 통계가 재계산되었습니다."
      if result["error_count"] > 0:
        message += f" ({result['error_count']}명 실패)"

      self.message_user(request, message)
      return redirect(reverse_lazy("admin:streaks_streakstatistics_changelist"))

    return render(
      request,
      "admin/streaks/recalculate_statistics_action.html",
      {
        "form": form,
        "title": "스트릭 통계 재계산",
        **self.admin_site.each_context(request),
      },
    )

  # Unfold row action
  @action(description="통계 재계산", url_path="recalculate")
  def recalculate_statistics(self, request: HttpRequest, object_id: int):
    """StreakLog 데이터를 기반으로 스트릭 통계를 재계산한다"""
    statistics = StreakStatistics.objects.get(pk=object_id)
    user = statistics.user

    # 서비스를 통해 재계산
    updated_statistics = RecalculateStreakStatisticsService(user=user).perform()

    self.message_user(
      request, f"'{user.email}' 사용자의 스트릭 통계가 재계산되었습니다. "
      f"(현재: {updated_statistics.current_streak}일, 최장: {updated_statistics.longest_streak}일)"
    )
    return redirect(reverse_lazy("admin:streaks_streakstatistics_changelist"))

  def has_recalculate_statistics_permission(self, request: HttpRequest):
    """통계 재계산 권한"""
    return request.user.is_staff

  def has_recalculate_multiple_statistics_permission(self, request: HttpRequest):
    """다중 통계 재계산 권한"""
    return request.user.is_staff
