from datetime import timedelta

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

    if overlap_qs.exists():
      raise ValidationError("해당 기간에 이미 활성 유료 구독이 존재합니다. 기존 구독을 먼저 취소해주세요.")

  actions = [
    "cancel_subscriptions",
    "set_selected_users_to_free",
    "set_selected_users_to_pro_for_one_year",
  ]

  @admin.action(description="선택한 구독 취소")
  def cancel_subscriptions(self, request, queryset):
    now = timezone.now()
    # 이미 취소되지 않은 것만 처리
    updated = queryset.filter(cancelled_at__isnull=True).update(cancelled_at=now)
    if hasattr(request, "_messages"):
      self.message_user(request, f"{updated}개 구독이 취소 처리되었습니다.")

  @admin.action(description="선택한 사용자 무료 플랜 전환")
  def set_selected_users_to_free(self, request, queryset):
    now = timezone.now()
    user_ids = list(queryset.values_list("user_id", flat=True).distinct())

    # 기존 활성 유료 구독은 즉시 종료 처리
    Subscription.objects.filter(
      user_id__in=user_ids,
      started_at__lte=now,
    ).exclude(plan_type=PlanType.FREE).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).update(
      expires_at=now,
      cancelled_at=now,
    )

    created_count = 0
    for user_id in user_ids:
      has_active_free = (
        Subscription.objects.filter(
          user_id=user_id,
          plan_type=PlanType.FREE,
          started_at__lte=now,
        ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).exists()
      )

      if has_active_free:
        continue

      Subscription.objects.create(
        user_id=user_id,
        plan_type=PlanType.FREE,
        started_at=now,
        expires_at=None,
      )
      created_count += 1

    if hasattr(request, "_messages"):
      self.message_user(
        request,
        f"{len(user_ids)}명 대상 무료 플랜 전환 처리 완료 (신규 free 생성: {created_count}건)",
      )

  @admin.action(description="선택한 사용자 Pro 플랜(1년) 설정")
  def set_selected_users_to_pro_for_one_year(self, request, queryset):
    now = timezone.now()
    expires_at = now + timedelta(days=365)
    user_ids = list(queryset.values_list("user_id", flat=True).distinct())

    # 기존 활성 유료 구독은 종료 처리 후 신규 1년 Pro 생성
    Subscription.objects.filter(
      user_id__in=user_ids,
      started_at__lte=now,
    ).exclude(plan_type=PlanType.FREE).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).update(
      expires_at=now,
      cancelled_at=now,
    )

    created_count = 0
    for user_id in user_ids:
      Subscription.objects.create(
        user_id=user_id,
        plan_type=PlanType.PRO,
        started_at=now,
        expires_at=expires_at,
      )
      created_count += 1

    if hasattr(request, "_messages"):
      self.message_user(
        request,
        f"{len(user_ids)}명 대상 Pro 1년 구독 설정 완료 (신규 pro 생성: {created_count}건)",
      )
