from common.validators import BaseValidator, validation_method
from django.core.exceptions import ValidationError
from django.db.models import QuerySet


class ProfileValidator(BaseValidator):
  """Profile 모델 검증"""

  @validation_method(priority=10)
  def validate_jobs_same_category(self):
    """연결된 jobs가 모두 같은 job_category에 속하는지 검증"""
    jobs = self.instance.jobs.all() if self.instance.pk else []
    job_category = self.instance.job_category

    if not jobs or not job_category:
      return

    invalid_job_names = self._get_invalid_job_names(jobs, job_category.id)

    if not invalid_job_names:
      return

    raise ValidationError(
      {"jobs": (f"선택한 직업 중 '{', '.join(invalid_job_names)}'은(는) "
                f"'{job_category.name}' 직군에 속하지 않습니다.")}
    )

  def _get_invalid_job_names(self, jobs, job_category_id):
    """잘못된 job 이름들을 반환"""
    return (
      self._get_invalid_from_queryset(jobs, job_category_id)
      if isinstance(jobs, QuerySet) else self._get_invalid_from_list(jobs, job_category_id)
    )

  @staticmethod
  def _get_invalid_from_queryset(jobs, job_category_id):
    """QuerySet에서 잘못된 job 이름들을 반환"""
    invalid_jobs = jobs.exclude(category_id=job_category_id)
    if not invalid_jobs.exists():
      return []
    return list(invalid_jobs.values_list("name", flat=True))

  @staticmethod
  def _get_invalid_from_list(jobs, job_category_id):
    """리스트에서 잘못된 job 이름들을 반환"""
    invalid_jobs = [job for job in jobs if job.category_id != job_category_id]
    return [job.name for job in invalid_jobs]
