from common.services import BaseService
from tickets.models import TicketLog, UserTicket
from tickets.services.get_or_create_user_ticket_service import GetOrCreateUserTicketService


class BaseTicketService(BaseService):
  """티켓 변동 서비스의 공통 로직을 제공한다."""

  required_value_kwargs = ["amount"]

  def _extract_params(self):
    """amount, reason, metadata를 kwargs에서 추출한다."""
    return (
      self.kwargs["amount"],
      self.kwargs.get("reason", ""),
      self.kwargs.get("metadata", {}),
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

  def _save_and_log(self, ticket, action_type, log_amount, reason, metadata):
    """티켓을 저장하고 TicketLog를 기록한다."""
    ticket.save(update_fields=["count", "updated_at"])
    TicketLog.objects.create(
      user=self.user,
      action_type=action_type,
      amount=log_amount,
      balance_after=ticket.count,
      reason=reason,
      metadata=metadata,
    )
