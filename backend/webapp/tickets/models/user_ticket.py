from common.models import BaseModel
from django.conf import settings
from django.db import models


class UserTicket(BaseModel):
  """사용자가 보유한 티켓 수.

  - daily_count: 구독 정책에 의해 매일 리셋되는 일일 티켓
  - purchased_count: 구매/보상 등으로 획득한 영구 티켓
  - total_count: 두 값의 합산 (사용 가능한 총 티켓)

  티켓 사용 시 daily_count를 먼저 소진하고, 부족하면 purchased_count에서 차감한다.
  """

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
  daily_count = models.PositiveIntegerField(
    default=0,
    verbose_name="일일 티켓 수",
    help_text="구독 정책에 의해 매일 리셋되는 티켓",
  )
  purchased_count = models.PositiveIntegerField(
    default=0,
    verbose_name="구매 티켓 수",
    help_text="구매/보상 등으로 획득한 영구 티켓",
  )

  @property
  def total_count(self) -> int:
    """사용 가능한 총 티켓 수."""
    return self.daily_count + self.purchased_count

  def deduct(self, amount: int):
    """티켓을 차감한다. daily_count를 먼저 소진하고 부족하면 purchased_count에서 차감."""
    if amount > self.total_count:
      raise ValueError(f"티켓이 부족합니다. (보유: {self.total_count}, 필요: {amount})")

    if amount <= self.daily_count:
      self.daily_count -= amount
    else:
      remainder = amount - self.daily_count
      self.daily_count = 0
      self.purchased_count -= remainder

  def __str__(self):
    return f"{self.user} — 일일: {self.daily_count}, 구매: {self.purchased_count} (총: {self.total_count})"
