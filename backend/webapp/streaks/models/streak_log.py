from common.models import BaseModel
from django.conf import settings
from django.db import models


class StreakLog(BaseModel):
  """날짜별 면접 참여 횟수 기록. 달력 뷰 데이터 소스."""

  class Meta(BaseModel.Meta):
    verbose_name = "스트릭 로그"
    verbose_name_plural = "스트릭 로그 목록"
    constraints = [models.UniqueConstraint(
      fields=["user", "date"],
      name="unique_streak_log_user_date",
    )]
    indexes = [
      *BaseModel.Meta.indexes,
    ]

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="streak_logs",
    verbose_name="사용자",
  )
  date = models.DateField(verbose_name="참여 날짜")
  interview_results_count = models.PositiveIntegerField(
    default=0,
    verbose_name="해당 날 면접 참여 횟수",
  )

  # interview_result_ids = ArrayField(
  #   base_field=models.BigIntegerField(),
  #   default=list,
  #   blank=True,
  #   verbose_name="면접 결과 ID 목록",
  # )
  # 향후 interview_sessions 완료 이벤트 연동 시 활성화 예정.
  # from django.contrib.postgres.fields import ArrayField 사용.

  def __str__(self):
    return f"{self.user} — {self.date} ({self.interview_results_count}회)"
