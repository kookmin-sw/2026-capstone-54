from django.db.models.signals import pre_save
from django.dispatch import receiver
from job_descriptions.models.job_description import JobDescription


@receiver(pre_save, sender=JobDescription)
def clean_job_description_url(sender, instance, update_fields, **kwargs):
  """URL을 저장하는 상황에서만 UTM 파라미터를 정리한다."""
  if update_fields is not None and "url" not in update_fields:
    return
  if instance.url:
    instance.url = JobDescription._strip_utm_params(instance.url)
