from common.models import BaseModel
from django.db import models
from subscriptions.enums import PlanType


class SubscriptionPlanTicketPolicy(BaseModel):
  """구독 플랜별 일일 티켓 지급 정책.

  매일 KST 00:00에 해당 플랜에 활성 구독 중인 사용자에게
  daily_ticket_amount만큼 티켓을 지급한다.
  """

  class Meta(BaseModel.Meta):
    verbose_name = "구독 플랜 티켓 정책"
    verbose_name_plural = "구독 플랜 티켓 정책 목록"
    ordering = ["plan_type"]
    constraints = [models.UniqueConstraint(
      fields=["plan_type"],
      name="unique_subscription_plan_ticket_policy",
    )]

  plan_type = models.CharField(
    max_length=20,
    choices=PlanType.choices,
    unique=True,
    verbose_name="요금제",
  )
  daily_ticket_amount = models.PositiveIntegerField(verbose_name="일일 지급 티켓 수", )
  is_active = models.BooleanField(
    default=True,
    verbose_name="활성 여부",
  )

  def __str__(self):
    return f"{self.get_plan_type_display()}: {self.daily_ticket_amount}개/일"
