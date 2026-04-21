import uuid

from common.models import BaseModel, BaseModelManager, BaseModelQuerySet
from django.conf import settings
from django.db import models
from django.utils import timezone


class PasswordResetTokenQuerySet(BaseModelQuerySet):

  def active(self, user):
    """만료되지 않고 미사용인 토큰을 반환한다."""
    return self.filter(user=user, used_at__isnull=True, expires_at__gt=timezone.now())


class PasswordResetTokenManager(BaseModelManager.from_queryset(PasswordResetTokenQuerySet)):
  pass


class PasswordResetToken(BaseModel):
  """비밀번호 재설정 토큰"""

  class Meta:
    db_table = "password_reset_tokens"
    verbose_name = "비밀번호 재설정 토큰"
    verbose_name_plural = "비밀번호 재설정 토큰 목록"
    indexes = [
      models.Index(fields=["user", "used_at"]),
      models.Index(fields=["token", "used_at"]),
    ]

  objects = PasswordResetTokenManager()

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="password_reset_tokens",
    verbose_name="사용자",
  )
  token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
  expires_at = models.DateTimeField()
  used_at = models.DateTimeField(null=True, blank=True)

  @property
  def is_used(self):  # used_at이 있으면 → 이미 사용된 토큰
    return self.used_at is not None

  @property
  def is_expired(self):  # 현재 시각이 expires_at을 지났으면 → 만료
    return timezone.now() > self.expires_at

  @property
  def is_valid(self):  # 사용되지도, 만료되지도 않았으면 → 유효
    return not self.is_used and not self.is_expired

  def __str__(self):
    return f"PasswordResetToken #{self.pk} (user={self.user_id})"
