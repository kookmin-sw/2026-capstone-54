from common.models.base_model_with_soft_delete import BaseModelWithSoftDelete
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from users.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin, BaseModelWithSoftDelete):

  class Meta:
    db_table = "users"
    verbose_name = "User"
    verbose_name_plural = "Users"

  name = models.CharField(max_length=50, blank=True, default="")
  email = models.EmailField(max_length=320, unique=True)
  email_confirmed_at = models.DateTimeField(null=True, blank=True)
  profile_completed_at = models.DateTimeField(null=True, blank=True)
  is_staff = models.BooleanField(default=False)
  is_active = models.BooleanField(default=True)

  USERNAME_FIELD = "email"
  REQUIRED_FIELDS = []

  objects = UserManager()

  @property
  def is_email_confirmed(self):
    return self.email_confirmed_at is not None

  @property
  def is_profile_completed(self):
    return self.profile_completed_at is not None

  def delete(self, using=None, keep_parents=False):
    """소프트 삭제 + 개인정보 마스킹"""
    from users.services import UserMaskingService

    UserMaskingService(user=self).perform()
    super().delete(using=using, keep_parents=keep_parents)
