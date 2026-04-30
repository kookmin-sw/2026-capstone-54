from common.models.base_model import BaseModel
from django.conf import settings
from django.db import models
from django.utils import timezone

from ..enums import EmailNotificationType


class UserEmailNotificationSettings(BaseModel):
  """사용자별 이메일 알림 동의 상태.

  각 알림 타입에 대해 동의 시각(`*_opted_in_at`)과 거절 시각(`*_opted_out_at`)을 저장한다.
  - 두 값은 동시에 NULL 이 아닐 수 없다 (DB CheckConstraint 강제).
  - 마이그레이션 시 모든 신규 row 의 `*_opted_in_at` 은 마이그레이션 수행 시각으로 채운다.
  - 동의 여부는 `is_opted_in(notification_type)` 으로 판정한다.
  """

  user = models.OneToOneField(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="email_notification_settings",
    verbose_name="사용자",
  )

  streak_reminder_opted_in_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="스트릭 리마인더 동의 시각",
  )
  streak_reminder_opted_out_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="스트릭 리마인더 거절 시각",
  )

  streak_expire_opted_in_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="스트릭 만료 경고 동의 시각",
  )
  streak_expire_opted_out_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="스트릭 만료 경고 거절 시각",
  )

  report_ready_opted_in_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="면접 리포트 완성 동의 시각",
  )
  report_ready_opted_out_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="면접 리포트 완성 거절 시각",
  )

  service_notice_opted_in_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="서비스 공지 동의 시각",
  )
  service_notice_opted_out_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="서비스 공지 거절 시각",
  )

  marketing_opted_in_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="마케팅 수신 동의 시각",
  )
  marketing_opted_out_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="마케팅 수신 거절 시각",
  )

  class Meta(BaseModel.Meta):
    db_table = "user_email_notification_settings"
    verbose_name = "사용자 이메일 알림 설정"
    verbose_name_plural = "사용자 이메일 알림 설정 목록"
    constraints = [
      models.CheckConstraint(
        condition=(
          models.Q(streak_reminder_opted_in_at__isnull=True)
          | models.Q(streak_reminder_opted_out_at__isnull=True)
        ),
        name="user_email_notif_streak_reminder_xor",
      ),
      models.CheckConstraint(
        condition=(
          models.Q(streak_expire_opted_in_at__isnull=True)
          | models.Q(streak_expire_opted_out_at__isnull=True)
        ),
        name="user_email_notif_streak_expire_xor",
      ),
      models.CheckConstraint(
        condition=(models.Q(report_ready_opted_in_at__isnull=True)
                   | models.Q(report_ready_opted_out_at__isnull=True)),
        name="user_email_notif_report_ready_xor",
      ),
      models.CheckConstraint(
        condition=(
          models.Q(service_notice_opted_in_at__isnull=True)
          | models.Q(service_notice_opted_out_at__isnull=True)
        ),
        name="user_email_notif_service_notice_xor",
      ),
      models.CheckConstraint(
        condition=(models.Q(marketing_opted_in_at__isnull=True)
                   | models.Q(marketing_opted_out_at__isnull=True)),
        name="user_email_notif_marketing_xor",
      ),
    ]
    indexes = [
      *BaseModel.Meta.indexes,
    ]

  def __str__(self):
    return f"EmailNotificationSettings({self.user})"

  @classmethod
  def default_consent_defaults(cls, opted_in_at=None) -> dict:
    """신규 row 생성 시 모든 알림을 동의 상태로 채우는 defaults dict 를 반환한다.

    회원 가입 시 모든 알림은 동의 상태로 시작한다 (사업 정책).
    `get_or_create(defaults=...)` 와 함께 사용하여 row 가 처음 생성될 때만 적용된다.
    """
    if opted_in_at is None:
      opted_in_at = timezone.now()
    return {EmailNotificationType.opted_in_field(member.value): opted_in_at for member in EmailNotificationType}

  def is_opted_in(self, notification_type: str) -> bool:
    opted_in_at = getattr(self, EmailNotificationType.opted_in_field(notification_type))
    opted_out_at = getattr(self, EmailNotificationType.opted_out_field(notification_type))
    if opted_out_at is None:
      return opted_in_at is not None
    if opted_in_at is None:
      return False
    return opted_in_at >= opted_out_at

  def apply_consent(self, notification_type: str, opted_in: bool) -> tuple[str, str]:
    in_field = EmailNotificationType.opted_in_field(notification_type)
    out_field = EmailNotificationType.opted_out_field(notification_type)
    now = timezone.now()
    if opted_in:
      setattr(self, in_field, now)
      setattr(self, out_field, None)
    else:
      setattr(self, in_field, None)
      setattr(self, out_field, now)
    return in_field, out_field

  def to_consent_dict(self) -> dict[str, bool]:
    return {member.value: self.is_opted_in(member.value) for member in EmailNotificationType}
