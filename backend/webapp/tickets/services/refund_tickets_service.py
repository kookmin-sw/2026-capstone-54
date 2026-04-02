from tickets.models import TicketLog
from tickets.services.base_ticket_service import BaseTicketService


class RefundTicketsService(BaseTicketService):
  """사용자에게 티켓을 환불(복구)한다."""

  def execute(self):
    amount, reason, metadata = self._extract_params()

    if amount <= 0:
      raise ValueError("환불할 티켓 수량은 양수여야 합니다.")

    ticket = self._get_or_create_ticket_with_lock()
    ticket.count += amount
    self._save_and_log(ticket, TicketLog.ActionType.REFUND, amount, reason, metadata)

    return ticket
