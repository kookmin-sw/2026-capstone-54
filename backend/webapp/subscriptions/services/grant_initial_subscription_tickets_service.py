import structlog
from common.services import BaseService
from subscriptions.models import SubscriptionPlanTicketPolicy
from tickets.models import UserTicket

logger = structlog.getLogger(__name__)


class GrantInitialSubscriptionTicketsService(BaseService):
  """신규 사용자의 구독 정책에 따라 초기 티켓을 지급한다.

  회원가입 직후 호출되어 사용자가 즉시 티켓을 사용할 수 있도록 한다.
  사용자의 현재 활성 구독(일반적으로 FREE)의 정책을 조회하여 일일 티켓을 지급한다.
  """

  def execute(self):
    from subscriptions.services import GetCurrentSubscriptionService

    user = self.user

    # 사용자의 현재 활성 구독 조회
    current_subscription = GetCurrentSubscriptionService(user=user).perform()

    if not current_subscription:
      logger.warning("No active subscription found for user=%s", user.id)
      return None

    # 구독 플랜의 티켓 정책 조회
    try:
      policy = SubscriptionPlanTicketPolicy.objects.get(plan_type=current_subscription.plan_type, is_active=True)
    except SubscriptionPlanTicketPolicy.DoesNotExist:
      logger.warning("No active ticket policy found for plan=%s", current_subscription.plan_type)
      return None

    daily_amount = policy.daily_ticket_amount
    if daily_amount <= 0:
      logger.info("No tickets to grant for plan=%s (amount=%d)", current_subscription.plan_type, daily_amount)
      return None

    # 사용자 티켓 생성 또는 업데이트
    user_ticket, created = UserTicket.objects.update_or_create(
      user=user,
      defaults={"daily_count": daily_amount},
      create_defaults={
        "daily_count": daily_amount,
        "purchased_count": 0
      },
    )

    logger.info(
      "Initial ticket granted | user=%s plan=%s amount=%d created=%s",
      user.id,
      current_subscription.plan_type,
      daily_amount,
      created,
    )

    return user_ticket
