from common.services import BaseService
from django.db.models import Q
from django.utils import timezone
from subscriptions.enums import PlanType
from subscriptions.models import Subscription

from .create_free_subscription_service import CreateFreeSubscriptionService


class GetCurrentSubscriptionService(BaseService):
  """현재 사용자의 활성 구독을 반환한다.

  유료 구독이 활성 중이면 유료 구독을 우선 반환하고,
  없으면 무료 구독을 반환한다.
  활성 여부는 날짜(started_at, expires_at)로 판단하며 DB의 status 컬럼은 없다.
  """

  def execute(self):
    now = timezone.now()

    # 현재 시각 기준 유효한 구독: 시작됐고 아직 만료되지 않은 것
    active_qs = Subscription.objects.filter(
      user=self.user,
      started_at__lte=now,
    ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))

    # 유료 구독 우선
    paid_subscription = active_qs.exclude(plan_type=PlanType.FREE).order_by("-started_at").first()
    if paid_subscription:
      return paid_subscription

    free_subscription = active_qs.filter(plan_type=PlanType.FREE).order_by("-started_at").first()
    if free_subscription:
      return free_subscription

    return CreateFreeSubscriptionService(user=self.user).perform()
