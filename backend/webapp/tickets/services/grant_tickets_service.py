from tickets.models import TicketLog
from tickets.services.base_ticket_service import BaseTicketService


class GrantTicketsService(BaseTicketService):
  """사용자에게 티켓을 지급한다. target으로 대상을 지정한다 (기본: purchased)."""

  def execute(self):
    amount, reason, metadata, target = self._extract_params()

    if amount <= 0:
      raise ValueError("발급할 티켓 수량은 양수여야 합니다.")

    ticket = self._get_or_create_ticket_with_lock()
    self._add(ticket, amount, target)
    self._save_and_log(ticket, TicketLog.ActionType.GRANT, amount, reason, metadata)

    return ticket
