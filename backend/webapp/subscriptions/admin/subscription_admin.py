from django.contrib import admin
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone
from subscriptions.enums import PlanType
from subscriptions.models import Subscription
from unfold.admin import ModelAdmin


@admin.register(Subscription)
class SubscriptionAdmin(ModelAdmin):
  list_display = (
    "user",
    "plan_type",
    "display_status",
    "is_cancelled",
    "started_at",
    "expires_at",
    "cancelled_at",
    "created_at",
  )
  list_filter = ("plan_type", )
  search_fields = ("user__email", )
  readonly_fields = ("cancelled_at", "created_at", "updated_at")
  ordering = ("-started_at", )
  autocomplete_fields = ("user", )

  fieldsets = (
    (
      "구독 정보",
      {
        "fields": ("user", "plan_type", "started_at", "expires_at"),
      },
    ),
    (
      "이력",
      {
        "fields": ("cancelled_at", "created_at", "updated_at"),
      },
    ),
  )

  @admin.display(description="상태")
  def display_status(self, obj: Subscription) -> str:
    return obj.status

  @admin.display(description="취소됨", boolean=True)
  def is_cancelled(self, obj: Subscription) -> bool:
    return obj.is_cancelled

  def save_model(self, request, obj, form, change):
    """유료 구독 생성 시 기간 중복 검증."""
    obj.full_clean()
    if not change and obj.plan_type != PlanType.FREE:
      self._validate_no_overlap(obj)
    super().save_model(request, obj, form, change)

  def _validate_no_overlap(self, obj: Subscription):
    """동일 사용자에게 기간이 겹치는 유료 구독이 있으면 ValidationError를 발생시킨다."""
    now = timezone.now()
    overlap_qs = (
      Subscription.objects.filter(
        user=obj.user,
        started_at__lte=obj.expires_at or now,
      ).exclude(plan_type=PlanType.FREE).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=obj.started_at))
    )

    if obj.pk:
      overlap_qs = overlap_qs.exclude(pk=obj.pk)

    if overlap_qs.exists():
      raise ValidationError("해당 기간에 이미 활성 유료 구독이 존재합니다. 기존 구독을 먼저 취소해주세요.")

  actions = ["cancel_subscriptions"]

  @admin.action(description="선택한 구독 취소")
  def cancel_subscriptions(self, request, queryset):
    now = timezone.now()
    # 이미 취소되지 않은 것만 처리
    updated = queryset.filter(cancelled_at__isnull=True).update(cancelled_at=now)
    self.message_user(request, f"{updated}개 구독이 취소 처리되었습니다.")
