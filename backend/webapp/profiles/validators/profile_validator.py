from common.validators import BaseValidator, validation_method
from django.core.exceptions import ValidationError


class ProfileValidator(BaseValidator):
  """Profile 모델 검증"""

  @validation_method(priority=10)
  def validate_jobs_same_category(self):
    """연결된 jobs가 모두 같은 job_category에 속하는지 검증"""
    if not self.instance.pk:
      return

    job_category = self.instance.job_category
    if not job_category:
      return

    jobs = self.instance.jobs.all()
    if not jobs.exists():
      return

    invalid_jobs = jobs.exclude(category_id=job_category.id)
    if invalid_jobs.exists():
      invalid_job_names = list(invalid_jobs.values_list("name", flat=True))
      raise ValidationError(
        {"jobs": (f"선택한 직업 중 '{', '.join(invalid_job_names)}'은(는) "
                  f"'{job_category.name}' 직군에 속하지 않습니다.")}
      )
