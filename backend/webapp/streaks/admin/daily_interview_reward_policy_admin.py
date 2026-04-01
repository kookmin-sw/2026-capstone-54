from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from streaks.models import DailyInterviewRewardPolicy
from unfold.admin import ModelAdmin
from unfold.decorators import action


@admin.register(DailyInterviewRewardPolicy)
class DailyInterviewRewardPolicyAdmin(ModelAdmin):
  list_display = (
    "interview_order",
    "ticket_reward",
    "is_active",
    "updated_at",
  )
  list_filter = ("is_active", )
  ordering = ("interview_order", )
  readonly_fields = (
    "created_at",
    "updated_at",
  )
  actions_list = ["seed_default_policies"]

  @action(description="기본 정책 생성", url_path="seed-default-policies")
  def seed_default_policies(self, request: HttpRequest):
    """기본 일일 인터뷰 보상 정책 생성 (1번째: 5개, 2~5번째: 3개)"""
    default_policies = [
      {
        "interview_order": 1,
        "ticket_reward": 5
      },
      {
        "interview_order": 2,
        "ticket_reward": 3
      },
      {
        "interview_order": 3,
        "ticket_reward": 3
      },
      {
        "interview_order": 4,
        "ticket_reward": 3
      },
      {
        "interview_order": 5,
        "ticket_reward": 3
      },
    ]

    created_count = 0
    updated_count = 0

    for policy_data in default_policies:
      policy, created = DailyInterviewRewardPolicy.objects.update_or_create(
        interview_order=policy_data["interview_order"],
        defaults={
          "ticket_reward": policy_data["ticket_reward"],
          "is_active": True,
        },
      )
      if created:
        created_count += 1
      else:
        updated_count += 1

    message = f"정책 생성: {created_count}개, 업데이트: {updated_count}개"
    self.message_user(request, message)

    return redirect(reverse_lazy("admin:streaks_dailyinterviewrewardpolicy_changelist"))

  def has_seed_default_policies_permission(self, request: HttpRequest):
    """기본 정책 생성 권한"""
    return request.user.is_superuser
