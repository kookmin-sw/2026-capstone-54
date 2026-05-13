from config.settings.base import (
  MAX_REWARDED_INTERVIEWS_PER_DAY,
  TICKET_REWARD_PER_INTERVIEW_ORDER,
)
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
    """기본 일일 인터뷰 보상 정책 생성"""
    created_count = 0
    updated_count = 0

    for order in range(1, MAX_REWARDED_INTERVIEWS_PER_DAY + 1):
      policy, created = DailyInterviewRewardPolicy.objects.update_or_create(
        interview_order=order,
        defaults={
          "ticket_reward": TICKET_REWARD_PER_INTERVIEW_ORDER[order],
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
