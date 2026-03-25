from common.models.base_model_with_soft_delete import SoftDeleteManager, SoftDeleteQuerySet
from django.contrib.auth.models import BaseUserManager
from django.utils import timezone
from users.services import UserMaskingService


class UserQuerySet(SoftDeleteQuerySet):

  def delete(self):
    for user in self:
      UserMaskingService(user=user).perform()
    return super().delete()


class UserManager(BaseUserManager, SoftDeleteManager.from_queryset(UserQuerySet)):

  def create_user(self, email, password=None, **extra_fields):
    if not email:
      raise ValueError("이메일은 필수입니다.")

    email = self.normalize_email(email)
    user = self.model(email=email, **extra_fields)
    user.set_password(password)
    user.save(using=self._db)
    return user

  def create_superuser(self, email, password=None, **extra_fields):
    extra_fields.setdefault("is_staff", True)
    extra_fields.setdefault("is_superuser", True)
    extra_fields.setdefault("email_confirmed_at", timezone.now())

    return self.create_user(email, password, **extra_fields)
