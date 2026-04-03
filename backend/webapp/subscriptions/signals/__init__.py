from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from subscriptions.services import CreateFreeSubscriptionService


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_free_subscription_on_user_created(sender, instance, created, **kwargs):
  """사용자 생성 시 무료 구독을 자동으로 생성한다."""
  if not created:
    return

  CreateFreeSubscriptionService(user=instance).perform()
