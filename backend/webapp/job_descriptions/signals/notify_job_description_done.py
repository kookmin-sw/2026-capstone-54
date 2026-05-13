from django.db.models.signals import post_save
from django.dispatch import receiver
from job_descriptions.enums import CollectionStatus
from job_descriptions.models.job_description import JobDescription


@receiver(post_save, sender=JobDescription)
def notify_job_description_done(sender, instance, update_fields, **kwargs):
  """채용공고 수집 완료 시 등록한 모든 사용자에게 알림을 발행한다."""
  if update_fields and "collection_status" not in update_fields:
    return
  if instance.collection_status != CollectionStatus.DONE:
    return

  from notifications.services import CreateNotificationService

  for ujd in instance.user_job_descriptions.select_related("user").all():
    title = ujd.title or instance.title or instance.url
    CreateNotificationService(
      user=ujd.user,
      message=f"채용공고 '{title}' 분석이 완료되었습니다.",
      category="jd",
      notifiable=ujd,
    ).perform()
