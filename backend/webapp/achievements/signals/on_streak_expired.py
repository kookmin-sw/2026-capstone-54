"""스트릭 만료 시 업적 평가를 트리거한다."""

from achievements.constants import TRIGGER_KEY_STREAK_EXPIRED, TRIGGER_TYPE_EVENT
from achievements.tasks import enqueue_evaluate_achievements_task
from django.dispatch import receiver
from streaks.signals import streak_expired


@receiver(streak_expired, dispatch_uid="achievements.on_streak_expired")
def on_streak_expired(sender, expired_user_ids, **kwargs):
  for user_id in expired_user_ids:
    enqueue_evaluate_achievements_task(
      user_id=user_id,
      trigger_type=TRIGGER_TYPE_EVENT,
      trigger_key=TRIGGER_KEY_STREAK_EXPIRED,
      context={},
    )
