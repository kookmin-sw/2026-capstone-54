from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from streaks.models import StreakStatistics
from streaks.services import StreakCalculator
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
    help_text="통계를 재계산할 사용자를 선택하세요.",
  )


@admin.register(StreakStatistics)
class StreakStatisticsAdmin(ModelAdmin):
  list_display = (
    "user",
    "current_streak",
    "longest_streak",
    "total_days",
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

  @admin.action(description="선택한 사용자 통계 재계산")
  def recalculate_selected_statistics(self, request, queryset):
    success_count = 0
    error_count = 0

    for stats in queryset:
      try:
        calculator = StreakCalculator(stats.user)
        updated = calculator.calculate()
        updated.save()
        success_count += 1
      except Exception:
        error_count += 1

    message = f"{success_count}명의 사용자에 대해 스트릭 통계가 재계산되었습니다."
    if error_count > 0:
      message += f" ({error_count}명 실패)"

    self.message_user(request, message)

  @action(description="통계 재계산 (다중)", url_path="recalculate-multiple")
  def recalculate_multiple_statistics(self, request: HttpRequest) -> HttpResponse:
    form = RecalculateStatisticsForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
      selected_users = form.cleaned_data["users"]
      success_count = 0

      for user in selected_users:
        try:
          calculator = StreakCalculator(user)
          stats = calculator.calculate()
          stats.save()
          success_count += 1
        except Exception:
          continue

      self.message_user(
        request,
        f"{success_count}명의 사용자에 대해 스트릭 통계가 재계산되었습니다.",
      )
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

  @action(description="통계 재계산", url_path="recalculate")
  def recalculate_statistics(self, request: HttpRequest, object_id: int):
    statistics = StreakStatistics.objects.get(pk=object_id)
    calculator = StreakCalculator(statistics.user)
    updated = calculator.calculate()
    updated.save()

    self.message_user(
      request,
      f"'{statistics.user.email}' 사용자의 스트릭 통계가 재계산되었습니다. "
      f"(현재: {updated.current_streak}일, 최장: {updated.longest_streak}일, 총 {updated.total_days}일)",
    )
    return redirect(reverse_lazy("admin:streaks_streakstatistics_changelist"))

  def has_recalculate_statistics_permission(self, request: HttpRequest):
    return request.user.is_staff

  def has_recalculate_multiple_statistics_permission(self, request: HttpRequest):
    return request.user.is_staff
