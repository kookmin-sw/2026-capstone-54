from dashboard.services import UserPracticeTimeCalculator, UserPracticeTimeStatisticsService
from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from interviews.models import UserPracticeTimeStatistics
from unfold.admin import ModelAdmin
from unfold.decorators import action
from unfold.widgets import UnfoldAdminSelectMultipleWidget

User = get_user_model()


class RecalculatePracticeTimeForm(forms.Form):
  users = forms.ModelMultipleChoiceField(
    label="사용자 선택",
    queryset=User.objects.all().order_by("email"),
    required=True,
    widget=UnfoldAdminSelectMultipleWidget,
    help_text="연습 시간 통계를 재계산할 사용자를 선택하세요.",
  )


@admin.register(UserPracticeTimeStatistics)
class UserPracticeTimeStatisticsAdmin(ModelAdmin):
  list_display = (
    "user",
    "total_practice_time_seconds",
    "total_practice_sessions_count",
    "last_calculated_at",
    "updated_at",
  )
  list_filter = ("last_calculated_at", )
  search_fields = ("user__email", )
  ordering = ("-total_practice_time_seconds", )
  readonly_fields = (
    "created_at",
    "updated_at",
    "last_calculated_at",
  )
  autocomplete_fields = ("user", )
  actions = ["recalculate_selected_statistics"]
  actions_list = ["recalculate_multiple_statistics"]
  actions_row = ["recalculate_statistics"]

  @admin.action(description="선택한 사용자 연습 시간 통계 재계산")
  def recalculate_selected_statistics(self, request, queryset):
    users = User.objects.filter(id__in=queryset.values_list("user_id", flat=True))
    count = UserPracticeTimeCalculator.bulk_calculate(users)

    self.message_user(request, f"{count}명의 사용자에 대해 연습 시간 통계가 재계산되었습니다.")

  @action(description="연습 시간 통계 재계산 (다중)", url_path="recalculate-multiple")
  def recalculate_multiple_statistics(self, request: HttpRequest) -> HttpResponse:
    form = RecalculatePracticeTimeForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
      selected_users = form.cleaned_data["users"]
      count = UserPracticeTimeCalculator.bulk_calculate(selected_users)

      self.message_user(
        request,
        f"{count}명의 사용자에 대해 연습 시간 통계가 재계산되었습니다.",
      )
      return redirect(reverse_lazy("admin:interviews_userpracticetimestatistics_changelist"))

    return render(
      request,
      "admin/interviews/recalculate_practice_time_action.html",
      {
        "form": form,
        "title": "연습 시간 통계 재계산",
        **self.admin_site.each_context(request),
      },
    )

  @action(description="연습 시간 재계산", url_path="recalculate")
  def recalculate_statistics(self, request: HttpRequest, object_id: int):
    statistics = UserPracticeTimeStatistics.objects.get(pk=object_id)
    updated = UserPracticeTimeStatisticsService(user=statistics.user).recalculate()

    self.message_user(
      request,
      f"'{statistics.user.email}' 사용자의 연습 시간 통계가 재계산되었습니다. "
      f"(총 {updated.total_practice_time_seconds}초 / 녹화 {updated.total_practice_sessions_count}건)",
    )
    return redirect(reverse_lazy("admin:interviews_userpracticetimestatistics_changelist"))

  def has_recalculate_statistics_permission(self, request: HttpRequest):
    return request.user.is_staff

  def has_recalculate_multiple_statistics_permission(self, request: HttpRequest):
    return request.user.is_staff
