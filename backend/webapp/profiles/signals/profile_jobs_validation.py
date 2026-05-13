"""Profile.jobs M2M 변경 시 검증 signal."""

from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from profiles.models import Profile


@receiver(m2m_changed, sender=Profile.jobs.through)
def validate_profile_jobs_on_change(sender, instance, action, **kwargs):
  """Profile의 jobs 변경 시 검증 실행. Admin, API, ORM 모든 경로에서 자동 실행."""
  if action in ["post_add", "post_remove", "post_clear"]:
    from profiles.validators import ProfileValidator

    validator = ProfileValidator(instance)
    validator.validate()
