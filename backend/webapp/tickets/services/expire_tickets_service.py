from tickets.models import TicketLog
from tickets.services.base_ticket_service import BaseTicketService


class ExpireTicketsService(BaseTicketService):
  """사용자의 티켓을 만료 처리한다."""

  def execute(self):
    amount, reason, metadata = self._extract_params()

    if amount <= 0:
      raise ValueError("만료할 티켓 수량은 양수여야 합니다.")

    ticket = self._get_ticket_with_lock()

    if ticket.count < amount:
      raise ValueError(f"만료할 티켓이 부족합니다. (보유: {ticket.count}, 만료 요청: {amount})")

    ticket.count -= amount
    self._save_and_log(ticket, TicketLog.ActionType.EXPIRE, -amount, reason, metadata)

    return ticket
