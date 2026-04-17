"""User.profile_completed_at 변경 시 업적 평가를 트리거한다."""

from achievements.constants import TRIGGER_KEY_USER_PROFILE_COMPLETED, TRIGGER_TYPE_EVENT
from achievements.tasks import enqueue_evaluate_achievements_task
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=get_user_model(), dispatch_uid="achievements.on_profile_completed")
def on_profile_completed(sender, instance, created, update_fields=None, **kwargs):
  if not instance.profile_completed_at:
    return

  if created:
    should_enqueue = True
  elif update_fields is None:
    should_enqueue = True
  else:
    should_enqueue = "profile_completed_at" in update_fields

  if not should_enqueue:
    return

  transaction.on_commit(
    lambda: enqueue_evaluate_achievements_task(
      user_id=instance.id,
      trigger_type=TRIGGER_TYPE_EVENT,
      trigger_key=TRIGGER_KEY_USER_PROFILE_COMPLETED,
      context={},
    )
  )
