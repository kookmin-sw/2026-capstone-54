from common.models import BaseModel
from django.conf import settings
from django.db import models
from django.utils import timezone
from subscriptions.enums import PlanType, SubscriptionStatus


class Subscription(BaseModel):
  """사용자 구독 정보.

  - 사용자 생성 시 free 구독이 자동으로 생성된다 (expires_at=None → 무기한 ACTIVE).
  - status ACTIVE: expires_at이 아직 도달하지 않은 구독 (취소 여부 무관).
  - status EXPIRED: expires_at이 현재 시각을 지난 구독.
  """

  class Meta(BaseModel.Meta):
    verbose_name = "구독"
    verbose_name_plural = "구독 목록"
    ordering = ["-started_at"]

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="subscriptions",
    verbose_name="사용자",
  )
  plan_type = models.CharField(
    max_length=20,
    choices=PlanType.choices,
    default=PlanType.FREE,
    verbose_name="요금제",
  )
  started_at = models.DateTimeField(
    default=timezone.now,
    verbose_name="구독 시작일시",
  )
  expires_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="구독 만료일시",
    help_text="NULL이면 무기한 (무료 플랜)",
  )
  cancelled_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="구독 취소일시",
    help_text="취소 의사를 표시한 일시. expires_at 전이면 여전히 ACTIVE.",
  )

  def __str__(self):
    return f"{self.user} — {self.get_plan_type_display()} ({self.status})"

  @property
  def status(self) -> str:
    """날짜 기반으로 현재 구독 상태를 반환한다.

    - started_at이 아직 도달하지 않았으면 PENDING
    - expires_at이 현재 시각을 지났으면 EXPIRED
    - 그 외(시작됐고 아직 만료 전)이면 ACTIVE
    취소 여부(is_cancelled)는 상태에 영향을 주지 않는다.
    """
    now = timezone.now()
    if self.started_at > now:
      return SubscriptionStatus.PENDING
    if self.expires_at is not None and self.expires_at <= now:
      return SubscriptionStatus.EXPIRED
    return SubscriptionStatus.ACTIVE

  @property
  def is_cancelled(self) -> bool:
    """취소 의사가 기록된 구독인지 반환한다. ACTIVE 상태일 수 있다."""
    return self.cancelled_at is not None

  @property
  def is_active_now(self) -> bool:
    """현재 시점에서 실제로 사용 가능한 구독인지 확인한다."""
    return self.status == SubscriptionStatus.ACTIVE
