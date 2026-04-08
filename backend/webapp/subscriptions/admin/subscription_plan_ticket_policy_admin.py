from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from subscriptions.models import SubscriptionPlanTicketPolicy
from subscriptions.services import SeedTicketPolicyService
from unfold.admin import ModelAdmin
from unfold.decorators import action


@admin.register(SubscriptionPlanTicketPolicy)
class SubscriptionPlanTicketPolicyAdmin(ModelAdmin):
  list_display = (
    "plan_type",
    "daily_ticket_amount",
    "is_active",
    "updated_at",
  )
  list_filter = ("plan_type", "is_active")
  ordering = ("plan_type", )
  readonly_fields = ("created_at", "updated_at")
  actions_list = ["seed_default_policies"]

  @action(description="기본 티켓 정책 생성", url_path="seed-policies")
  def seed_default_policies(self, request: HttpRequest):
    """Free(30개/일), Pro(300개/일) 기본 정책을 생성한다."""
    result = SeedTicketPolicyService().perform()

    if result["created_count"] > 0:
      self.message_user(request, f"{result['created_count']}개의 기본 정책이 생성되었습니다.")
    else:
      self.message_user(request, "이미 모든 기본 정책이 존재합니다.")

    return redirect(reverse_lazy("admin:subscriptions_subscriptionplanticketpolicy_changelist"))

  def has_seed_default_policies_permission(self, request: HttpRequest):
    return request.user.is_superuser
