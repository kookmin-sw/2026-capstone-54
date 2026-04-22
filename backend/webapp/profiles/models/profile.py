import uuid

from common.models import BaseModelWithSoftDelete
from django.conf import settings
from django.db import models
from profiles.enums import CareerStage


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
  career_stage = models.CharField(max_length=20, choices=CareerStage.choices, default=CareerStage.OTHER)
  jobs = models.ManyToManyField("Job", related_name="profiles")
  avatar = models.ImageField(
    upload_to=avatar_upload_to,
    null=True,
    blank=True,
  )

  def __str__(self):
    return f"Profile of {self.user.email}"
