from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from ..models import UserEmailNotificationSettings


@receiver(
  post_save,
  sender=settings.AUTH_USER_MODEL,
  dispatch_uid="notifications.create_user_email_notification_settings_on_user_created",
)
def create_user_email_notification_settings_on_user_created(
  sender,
  instance,
  created,
  raw=False,
  using=None,
  **kwargs,
):
  """사용자 생성 시 이메일 알림 설정을 자동으로 생성한다.

  안전장치:
  - `raw=True` (fixture 로딩) 시 건너뛴다 — 관련 모델이 아직 일관 상태가 아닐 수 있음.
  - `transaction.on_commit()` 으로 user 트랜잭션 커밋 후에만 실행 — 사용자 생성 롤백 시 깨끗하게 폐기.
  - `IntegrityError` 방어 — 동시 트랜잭션이 이미 행을 만든 race 케이스에서도 정상 동작.
  - `dispatch_uid` 로 중복 시그널 등록 방지 (auto-reload, 다중 import 등).

  비고: `bulk_create()` 는 시그널을 발행하지 않으므로, 우회 경로(어드민 import,
  데이터 마이그레이션 등)에서는 별도 backfill 이 필요하다.
  """
  if not created or raw:
    return

  user_id = instance.pk
  db_alias = using

  def _ensure_settings():
    try:
      UserEmailNotificationSettings.objects.using(db_alias).get_or_create(
        user_id=user_id,
        defaults=UserEmailNotificationSettings.default_consent_defaults(),
      )
    except IntegrityError:
      pass

  transaction.on_commit(_ensure_settings, using=db_alias)
