from common.services import BaseService
from tickets.models import TicketLog, UserTicket
from tickets.services.get_or_create_user_ticket_service import GetOrCreateUserTicketService

# target 옵션
TARGET_DAILY = "daily"
TARGET_PURCHASED = "purchased"
TARGET_AUTO = "auto"  # daily를 먼저 소진하고 부족하면 purchased에서 차감

VALID_TARGETS = {TARGET_DAILY, TARGET_PURCHASED, TARGET_AUTO}


class BaseTicketService(BaseService):
  """티켓 변동 서비스의 공통 로직을 제공한다.

  kwargs:
    target: "daily" | "purchased" | "auto"
      - daily: daily_count만 조작
      - purchased: purchased_count만 조작
      - auto: daily_count를 먼저 소진하고 부족하면 purchased_count에서 차감 (차감 전용)
  """

  required_value_kwargs = ["amount"]

  def _extract_params(self):
    """amount, reason, metadata, target을 kwargs에서 추출한다."""
    target = self.kwargs.get("target", TARGET_PURCHASED)
    if target not in VALID_TARGETS:
      raise ValueError(f"target은 {VALID_TARGETS} 중 하나여야 합니다.")
    return (
      self.kwargs["amount"],
      self.kwargs.get("reason", ""),
      self.kwargs.get("metadata", {}),
      target,
    )

  def _get_or_create_ticket_with_lock(self) -> UserTicket:
    """UserTicket을 lock과 함께 조회하거나 생성한다."""
    return GetOrCreateUserTicketService(user=self.user, lock=True).perform()

  def _get_ticket_with_lock(self) -> UserTicket:
    """기존 UserTicket을 lock과 함께 조회한다. 없으면 ValueError."""
    try:
      return UserTicket.objects.select_for_update().get(user=self.user)
    except UserTicket.DoesNotExist:
      raise ValueError("티켓을 보유하고 있지 않습니다.")

  def _add(self, ticket, amount, target):
    """target에 따라 티켓을 추가한다. auto는 추가에 사용할 수 없다."""
    if target == TARGET_DAILY:
      ticket.daily_count += amount
    elif target == TARGET_PURCHASED:
      ticket.purchased_count += amount
    else:
      raise ValueError("target='auto'는 추가에 사용할 수 없습니다.")

  def _subtract(self, ticket, amount, target):
    """target에 따라 티켓을 차감한다."""
    if target == TARGET_AUTO:
      ticket.deduct(amount)
    elif target == TARGET_DAILY:
      if ticket.daily_count < amount:
        raise ValueError(f"일일 티켓이 부족합니다. (보유: {ticket.daily_count}, 필요: {amount})")
      ticket.daily_count -= amount
    elif target == TARGET_PURCHASED:
      if ticket.purchased_count < amount:
        raise ValueError(f"구매 티켓이 부족합니다. (보유: {ticket.purchased_count}, 필요: {amount})")
      ticket.purchased_count -= amount

  def _save_and_log(self, ticket, action_type, log_amount, reason, metadata):
    """티켓을 저장하고 TicketLog를 기록한다."""
    ticket.save(update_fields=["daily_count", "purchased_count", "updated_at"])
    TicketLog.objects.create(
      user=self.user,
      action_type=action_type,
      amount=log_amount,
      balance_after=ticket.total_count,
      reason=reason,
      metadata=metadata,
    )
