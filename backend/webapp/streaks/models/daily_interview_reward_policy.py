from common.models import BaseModel
from django.db import models


class DailyInterviewRewardPolicy(BaseModel):
  """하루 인터뷰 순서별 지급 티켓 수 정책.

  하루 최대 5번의 인터뷰에만 티켓을 지급한다.
  interview_order=1 이 첫 번째 인터뷰(출석 보상), 이후로 점감.
  """

  class Meta(BaseModel.Meta):
    verbose_name = "일일 인터뷰 보상 정책"
    verbose_name_plural = "일일 인터뷰 보상 정책 목록"
    ordering = ["interview_order"]

  interview_order = models.PositiveSmallIntegerField(
    unique=True,
    verbose_name="인터뷰 순서 (1~5)",
  )
  ticket_reward = models.PositiveIntegerField(verbose_name="지급 티켓 수", )
  is_active = models.BooleanField(
    default=True,
    verbose_name="활성 여부",
  )

  def __str__(self):
    return f"{self.interview_order}번째 인터뷰 → {self.ticket_reward} 티켓"
