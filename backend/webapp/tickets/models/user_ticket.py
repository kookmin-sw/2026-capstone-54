from common.models import BaseModel
from django.conf import settings
from django.db import models


class UserTicket(BaseModel):
  """사용자가 보유한 티켓 수"""

  class Meta(BaseModel.Meta):
    verbose_name = "사용자 티켓"
    verbose_name_plural = "사용자 티켓 목록"
    constraints = [models.UniqueConstraint(
      fields=["user"],
      name="unique_user_ticket",
    )]

  user = models.OneToOneField(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="ticket",
    verbose_name="사용자",
  )
  count = models.PositiveIntegerField(
    default=0,
    verbose_name="보유 티켓 수",
  )

  def __str__(self):
    return f"{self.user} — {self.count}개"
