from common.models import BaseModel
from django.conf import settings
from django.db import models


class StreakStatistics(BaseModel):
  """사용자 스트릭 집계값 캐시. 현재 연속 일수와 역대 최장 기록을 보관한다."""

  class Meta(BaseModel.Meta):
    verbose_name = "스트릭 통계"
    verbose_name_plural = "스트릭 통계 목록"

  user = models.OneToOneField(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="streak_statistics",
    verbose_name="사용자",
  )
  current_streak = models.PositiveIntegerField(
    default=0,
    verbose_name="현재 연속 일수",
  )
  longest_streak = models.PositiveIntegerField(
    default=0,
    verbose_name="역대 최장 연속 일수",
  )
  last_participated_date = models.DateField(
    null=True,
    blank=True,
    verbose_name="마지막 참여 날짜",
  )

  def __str__(self):
    return f"{self.user} — 현재 {self.current_streak}일 / 최장 {self.longest_streak}일"
