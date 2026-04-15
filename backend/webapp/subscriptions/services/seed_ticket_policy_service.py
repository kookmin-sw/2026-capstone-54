from config.settings.base import FREE_DAILY_TICKET_AMOUNT, PRO_DAILY_TICKET_AMOUNT
from subscriptions.enums import PlanType
from subscriptions.models import SubscriptionPlanTicketPolicy

DEFAULT_POLICIES = [
  {
    "plan_type": PlanType.FREE,
    "daily_ticket_amount": FREE_DAILY_TICKET_AMOUNT
  },
  {
    "plan_type": PlanType.PRO,
    "daily_ticket_amount": PRO_DAILY_TICKET_AMOUNT
  },
]


class SeedTicketPolicyService:
  """구독 플랜별 기본 티켓 정책을 생성한다.

    이미 존재하는 plan_type은 건너뛴다.
    """

  def perform(self):
    created_count = 0
    for policy_data in DEFAULT_POLICIES:
      _, created = SubscriptionPlanTicketPolicy.objects.get_or_create(
        plan_type=policy_data["plan_type"],
        defaults={
          "daily_ticket_amount": policy_data["daily_ticket_amount"],
          "is_active": True,
        },
      )
      if created:
        created_count += 1

    return {
      "created_count": created_count,
      "total_policies": len(DEFAULT_POLICIES),
    }
