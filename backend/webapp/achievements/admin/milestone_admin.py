"""마일스톤 Admin 인터페이스."""

import json

from achievements.admin.views import MilestoneQuickAddView
from achievements.models import Milestone
from django.contrib import admin
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.urls import path, reverse
from django.utils.safestring import mark_safe
from unfold.admin import ModelAdmin
from unfold.decorators import action


@admin.register(Milestone)
class MilestoneAdmin(ModelAdmin):
  """마일스톤 전용 Admin 인터페이스."""

  list_display = ('days_display', 'name', 'reward_display', 'is_active', 'created_at')
  list_filter = ('is_active', 'created_at')
  search_fields = ('code', 'name')
  ordering = ('condition_payload__rules__0__target', )
  readonly_fields = (
    'code',
    'category',
    'condition_type',
    'condition_payload_pretty',
    'reward_payload_pretty',
    'created_at',
    'updated_at',
  )

  fieldsets = (
    (None, {
      'fields': ('code', 'name', 'description', 'category', 'is_active')
    }),
    ('조건', {
      'fields': ('condition_type', 'condition_payload', 'condition_payload_pretty')
    }),
    ('보상', {
      'fields': ('reward_payload', 'reward_payload_pretty')
    }),
    ('기간', {
      'fields': ('starts_at', 'ends_at')
    }),
    ('메타', {
      'fields': ('created_at', 'updated_at'),
      'classes': ('collapse', )
    }),
  )

  actions_list = ['quick_add_milestone']

  def days_display(self, obj):
    """days 필드 표시."""
    rules = obj.condition_payload.get('rules', [])
    if rules:
      return rules[0].get('target', '-')
    return '-'

  days_display.short_description = '일 수'

  def reward_display(self, obj):
    """보상 정보 표시."""
    payload = obj.reward_payload
    if payload.get('type') == 'ticket':
      return f"티켓 {payload.get('amount', 0)}개"
    return '-'

  reward_display.short_description = '보상'

  def condition_payload_pretty(self, obj):
    """조건 JSON 포맷팅."""
    return mark_safe(f"<pre>{json.dumps(obj.condition_payload or {}, ensure_ascii=False, indent=2)}</pre>")

  condition_payload_pretty.short_description = "조건 JSON (보기 전용)"

  def reward_payload_pretty(self, obj):
    """보상 JSON 포맷팅."""
    return mark_safe(f"<pre>{json.dumps(obj.reward_payload or {}, ensure_ascii=False, indent=2)}</pre>")

  reward_payload_pretty.short_description = "보상 JSON (보기 전용)"

  @action(description="마일스톤 빠른 추가", url_path="quick-add")
  def quick_add_milestone(self, request: HttpRequest) -> HttpResponse:
    """마일스톤 빠른 추가 CustomPage로 리다이렉트."""
    return HttpResponseRedirect(reverse("admin:achievements_milestone_quick_add"))

  def has_quick_add_milestone_permission(self, request: HttpRequest) -> bool:
    """빠른 추가 권한 확인."""
    return request.user.is_superuser

  def get_urls(self):
    urls = super().get_urls()
    custom_urls = [
      path(
        "quick-add/",
        MilestoneQuickAddView.as_view(model_admin=self),
        name="achievements_milestone_quick_add",
      ),
    ]
    return custom_urls + urls
