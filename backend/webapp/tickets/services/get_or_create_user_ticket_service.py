from common.services import BaseService
from tickets.models import UserTicket


class GetOrCreateUserTicketService(BaseService):
  """사용자의 UserTicket을 조회하거나, 없으면 생성하여 반환한다."""

  def execute(self):
    lock = self.kwargs.get("lock", False)
    qs = UserTicket.objects.select_for_update() if lock else UserTicket.objects
    ticket, _ = qs.get_or_create(
      user=self.user,
      defaults={
        "daily_count": 0,
        "purchased_count": 0
      },
    )
    return ticket
