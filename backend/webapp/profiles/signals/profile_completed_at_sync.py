"""Profile 저장/삭제 시 user.profile_completed_at 동기화 signal."""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone
from profiles.models import Profile


@receiver(post_save, sender=Profile)
def set_profile_completed_at_on_save(sender, instance, **kwargs):
  """Profile 저장 시 user.profile_completed_at을 동기화한다.

  - 활성 프로필(deleted_at=None) 저장 → profile_completed_at 설정
  - soft delete(deleted_at != None) 저장 → profile_completed_at 초기화
  """
  user = instance.user

  if instance.deleted_at is None:
    if not user.profile_completed_at:
      user.profile_completed_at = timezone.now()
      user.save(update_fields=["profile_completed_at"])
  else:
    if user.profile_completed_at:
      user.profile_completed_at = None
      user.save(update_fields=["profile_completed_at"])


@receiver(post_delete, sender=Profile)
def clear_profile_completed_at_on_hard_delete(sender, instance, **kwargs):
  """Profile hard delete 시 user.profile_completed_at을 초기화한다."""
  user = instance.user

  if user.profile_completed_at:
    user.profile_completed_at = None
    user.save(update_fields=["profile_completed_at"])
