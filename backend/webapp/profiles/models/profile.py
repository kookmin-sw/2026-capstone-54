import uuid

from common.models import BaseModelWithSoftDelete
from django.conf import settings
from django.db import models
from django.db.models.signals import m2m_changed
from django.dispatch import receiver


def avatar_upload_to(instance, filename):
  ext = filename.rsplit(".", 1)[-1]
  return f"avatars/{uuid.uuid4()}.{ext}"


class Profile(BaseModelWithSoftDelete):
  """사용자 프로필 정보"""

  class Meta:
    db_table = "profiles"
    verbose_name = "Profile"
    verbose_name_plural = "Profiles"

  user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
  job_category = models.ForeignKey("JobCategory", on_delete=models.PROTECT, related_name="profiles")
  jobs = models.ManyToManyField("Job", related_name="profiles")
  avatar = models.ImageField(
    upload_to=avatar_upload_to,
    null=True,
    blank=True,
  )

  def __str__(self):
    return f"Profile of {self.user.email}"


@receiver(m2m_changed, sender=Profile.jobs.through)
def validate_profile_jobs_on_change(sender, instance, action, **kwargs):
  """
    Profile의 jobs 변경 시 검증 실행
    Admin, API, 직접 ORM 사용 등 모든 경로에서 자동 실행
    """
  if action in ["post_add", "post_remove", "post_clear"]:
    from profiles.validators import ProfileValidator

    validator = ProfileValidator(instance)
    validator.validate()
