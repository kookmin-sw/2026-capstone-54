from common.exceptions import ValidationException
from django.db.models.signals import pre_save
from django.dispatch import receiver
from resumes.models import Resume
from subscriptions.enums import PlanType
from subscriptions.services import (
  GetCurrentSubscriptionService,
  PlanFeaturePolicyService,
)


@receiver(pre_save, sender=Resume)
def validate_resume_plan_limit_on_create(sender, instance: Resume, **kwargs):
  """이력서 신규 생성 시 플랜 한도를 검증한다.

    text/file 뿐 아니라 structured 저장 경로도 동일하게 제한하기 위해
    Resume 모델 pre_save 시점에서 신규 생성만 검사한다.
    """

  # 기존 수정/업데이트는 제한 대상이 아니다.
  if instance.pk:
    return

  if not instance.user_id:
    return

  subscription = GetCurrentSubscriptionService(user=instance.user).perform()
  plan_type = subscription.plan_type if subscription else PlanType.FREE
  max_active_resumes = PlanFeaturePolicyService.get_max_active_resumes(plan_type)

  if max_active_resumes is None:
    return

  active_resume_count = Resume.objects.filter(user=instance.user).count()
  if active_resume_count >= max_active_resumes:
    raise ValidationException(field_errors={"resume": [f"무료 플랜은 최대 {max_active_resumes}개의 이력서만 등록할 수 있습니다."]})
