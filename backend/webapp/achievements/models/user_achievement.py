from common.models import BaseModel
from django.conf import settings
from django.db import models


class UserAchievement(BaseModel):
  """사용자 도전과제 달성 및 보상 수령 이력."""

  class Meta(BaseModel.Meta):
    verbose_name = "사용자 도전과제 달성"
    verbose_name_plural = "사용자 도전과제 달성 목록"
    constraints = [models.UniqueConstraint(
      fields=["user", "achievement"],
      name="unique_user_achievement",
    )]
    indexes = BaseModel.Meta.indexes + [
      models.Index(fields=["user", "-achieved_at"], name="user_achv_user_achvd_idx"),
    ]

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="user_achievements",
    verbose_name="사용자",
  )
  achievement = models.ForeignKey(
    "achievements.Achievement",
    on_delete=models.PROTECT,
    related_name="user_achievements",
    verbose_name="도전과제",
  )
  achieved_at = models.DateTimeField(verbose_name="달성 시각")
  achievement_snapshot_payload = models.JSONField(default=dict, blank=True, verbose_name="달성 근거 스냅샷")
  reward_claimed_at = models.DateTimeField(null=True, blank=True, verbose_name="보상 수령 시각")
  reward_claim_snapshot_payload = models.JSONField(default=dict, blank=True, verbose_name="보상 수령 스냅샷")

  def __str__(self):
    return f"{self.user} - {self.achievement.code}"
