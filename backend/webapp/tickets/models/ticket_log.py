from common.models import BaseModel
from django.conf import settings
from django.db import models


class TicketLog(BaseModel):
  """티켓 발급/사용 이력을 기록하는 모델"""

  class Meta(BaseModel.Meta):
    verbose_name = "티켓 이력"
    verbose_name_plural = "티켓 이력 목록"
    indexes = [
      models.Index(fields=["user", "-created_at"]),
      models.Index(fields=["action_type", "-created_at"]),
    ]

  class ActionType(models.TextChoices):
    GRANT = "grant", "발급"
    USE = "use", "사용"
    EXPIRE = "expire", "만료"
    REFUND = "refund", "환불"

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="ticket_logs",
    verbose_name="사용자",
  )
  action_type = models.CharField(
    max_length=20,
    choices=ActionType.choices,
    verbose_name="액션 타입",
  )
  amount = models.IntegerField(
    verbose_name="변동 수량",
    help_text="발급/환불은 양수, 사용/만료는 음수",
  )
  balance_after = models.PositiveIntegerField(verbose_name="변동 후 잔액", )
  reason = models.CharField(
    max_length=200,
    blank=True,
    verbose_name="사유",
    help_text="티켓 발급/사용 사유 (예: 출석 보상, 면접 사용 등)",
  )
  metadata = models.JSONField(
    default=dict,
    blank=True,
    verbose_name="메타데이터",
    help_text="추가 정보 (예: 관련 객체 ID, 이벤트 정보 등)",
  )

  def __str__(self):
    return f"{self.user} — {self.get_action_type_display()}: {self.amount:+d} (잔액: {self.balance_after})"
