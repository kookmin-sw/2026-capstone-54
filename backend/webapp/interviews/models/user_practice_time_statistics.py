from common.models import BaseModel
from django.conf import settings
from django.db import models


class UserPracticeTimeStatistics(BaseModel):
  """사용자 연습 시간 집계값 캐시. InterviewRecording.duration_ms 합계를 초 단위로 보관한다."""

  class Meta(BaseModel.Meta):
    db_table = "user_practice_time_statistics"
    verbose_name = "사용자 연습시간 통계"
    verbose_name_plural = "사용자 연습시간 통계 목록"

  user = models.OneToOneField(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="practice_time_statistic",
    verbose_name="사용자",
  )
  total_practice_time_seconds = models.PositiveBigIntegerField(
    default=0,
    verbose_name="총 연습 시간 (초)",
  )
  total_practice_sessions_count = models.PositiveIntegerField(
    default=0,
    verbose_name="집계된 녹화 수",
  )
  last_calculated_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="마지막 재계산 시각",
  )

  def __str__(self):
    return (f"{self.user} — {self.total_practice_time_seconds}s "
            f"({self.total_practice_sessions_count} recordings)")
