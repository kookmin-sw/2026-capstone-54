from tickets.models import TicketLog
from tickets.services.base_ticket_service import BaseTicketService


class ExpireTicketsService(BaseTicketService):
  """사용자의 티켓을 만료 처리한다. target으로 대상을 지정한다 (기본: purchased)."""

  def execute(self):
    amount, reason, metadata, target = self._extract_params()

    if amount <= 0:
      raise ValueError("만료할 티켓 수량은 양수여야 합니다.")

    ticket = self._get_or_create_ticket_with_lock()
    self._subtract(ticket, amount, target)
    self._save_and_log(ticket, TicketLog.ActionType.EXPIRE, -amount, reason, metadata)

    return ticket
