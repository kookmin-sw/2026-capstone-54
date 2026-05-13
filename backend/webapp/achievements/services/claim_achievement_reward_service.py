import structlog
from achievements.models import UserAchievement
from common.services import BaseService
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

logger = structlog.get_logger(__name__)


class ClaimAchievementRewardService(BaseService):
  """달성한 도전과제의 보상을 수령 처리한다."""

  required_value_kwargs = ["achievement_code"]

  def execute(self):
    achievement_code = self.kwargs["achievement_code"]
    with transaction.atomic():
      user_achievement = self._get_claimable_user_achievement()
      reward_payload = user_achievement.achievement.reward_payload or {}
      self._grant_ticket_reward(reward_payload)
      user_achievement.reward_claimed_at = timezone.now()
      user_achievement.reward_claim_snapshot_payload = {"reward_payload": reward_payload}
      user_achievement.save(update_fields=["reward_claimed_at", "reward_claim_snapshot_payload", "updated_at"])

    logger.info(
      "achievement_claim_succeeded",
      extra={
        "event": "achievement_claim_succeeded",
        "user_id": self.user.id,
        "achievement_code": achievement_code,
        "evaluation_result": True,
      },
    )
    return user_achievement

  def _get_claimable_user_achievement(self):
    user = self.user
    achievement_code = self.kwargs["achievement_code"]
    user_achievement = (
      UserAchievement.objects.select_related("achievement").select_for_update().filter(
        user=user, achievement__code=achievement_code
      ).first()
    )
    if not user_achievement:
      raise NotFound(detail={"achievement": "달성한 도전과제이 없습니다."})
    if not user_achievement.achievement.is_active:
      raise ValidationError(detail={"achievement": "비활성 도전과제은 보상을 수령할 수 없습니다."})
    if user_achievement.reward_claimed_at:
      raise ValidationError(detail={"achievement": "이미 보상을 수령한 도전과제입니다."})
    return user_achievement

  def _grant_ticket_reward(self, reward_payload: dict):
    from tickets.services import GrantTicketsService

    amount = reward_payload.get("amount")
    if not isinstance(amount, int) or amount <= 0:
      raise ValidationError(detail={"reward_payload": "티켓 보상 설정이 올바르지 않습니다."})

    GrantTicketsService(
      user=self.user,
      amount=amount,
      reason=f"도전과제 보상: {self.kwargs['achievement_code']}",
      metadata={
        "achievement_code": self.kwargs["achievement_code"]
      },
    ).perform()
