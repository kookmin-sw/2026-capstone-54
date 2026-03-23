from common.models import BaseModel
from common.models.base_model import BaseModelManager, BaseModelQuerySet
from django.db import models
from django.utils import timezone


class EmailVerificationCodeQuerySet(BaseModelQuerySet):

  def active(self, user):
    """만료되지 않고 미사용인 코드를 반환한다."""
    return self.filter(user=user, used_at__isnull=True, expires_at__gt=timezone.now())


class EmailVerificationCodeManager(BaseModelManager.from_queryset(EmailVerificationCodeQuerySet)):
  pass


class EmailVerificationCode(BaseModel):
  """6자리 OTP 이메일 인증 코드"""

  class Meta:
    db_table = "email_verification_codes"
    indexes = [
      models.Index(fields=["user", "used_at"]),
      models.Index(fields=["code", "used_at"]),
    ]

  objects = EmailVerificationCodeManager()

  user = models.ForeignKey(
    "users.User",
    on_delete=models.CASCADE,
    related_name="email_verification_codes",
  )
  code = models.CharField(max_length=6)  # 대문자 + 숫자 6자리
  expires_at = models.DateTimeField()
  used_at = models.DateTimeField(null=True, blank=True)

  @property
  def is_used(self):
    return self.used_at is not None
