from tickets.models import TicketLog
from tickets.services.base_ticket_service import TARGET_AUTO, BaseTicketService


class UseTicketsService(BaseTicketService):
  """사용자의 티켓을 사용(차감)한다. 기본 target은 auto (daily 우선 소진)."""

  def execute(self):
    amount, reason, metadata, target = self._extract_params()

    if amount <= 0:
      raise ValueError("사용할 티켓 수량은 양수여야 합니다.")

    ticket = self._get_ticket_with_lock()
    self._subtract(ticket, amount, target)
    self._save_and_log(ticket, TicketLog.ActionType.USE, -amount, reason, metadata)

    return ticket

  def _extract_params(self):
    """UseTicketsService의 기본 target은 auto이다."""
    self.kwargs.setdefault("target", TARGET_AUTO)
    return super()._extract_params()
