import logging

from common.services import BaseService
from django.db.models import Q
from django.utils import timezone
from subscriptions.models import Subscription, SubscriptionPlanTicketPolicy
from tickets.models import UserTicket

logger = logging.getLogger(__name__)


class GrantDailySubscriptionTicketsService(BaseService):
  """활성 구독 정책에 따라 모든 해당 사용자에게 일일 티켓을 리셋 지급한다.

  매일 KST 00:00에 Celery Beat 태스크에 의해 호출된다.

  일일 티켓은 누적이 아닌 리셋 방식이다:
  - UserTicket.daily_count를 정책의 daily_ticket_amount로 덮어쓴다.
  - 구매 티켓(purchased_count)은 영향받지 않는다.
  """

  def execute(self):
    now = timezone.now()
    policies = list(SubscriptionPlanTicketPolicy.objects.filter(is_active=True))

    if not policies:
      return 0

    # plan_type → daily_ticket_amount 매핑
    policy_map = {p.plan_type: p.daily_ticket_amount for p in policies}

    # 모든 활성 정책의 plan_type을 한 번에 조회 (N+1 방지)
    active_subscriptions = list(
      Subscription.objects.filter(
        plan_type__in=policy_map.keys(),
        started_at__lte=now,
      ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now)).select_related("user")
    )

    granted_count = 0
    for subscription in active_subscriptions:
      daily_amount = policy_map.get(subscription.plan_type, 0)
      if daily_amount <= 0:
        continue

      UserTicket.objects.update_or_create(
        user=subscription.user,
        defaults={"daily_count": daily_amount},
        create_defaults={
          "daily_count": daily_amount,
          "purchased_count": 0
        },
      )

      granted_count += 1
      logger.info(
        "Daily ticket reset | user=%s plan=%s amount=%d",
        subscription.user_id,
        subscription.plan_type,
        daily_amount,
      )

    return granted_count
