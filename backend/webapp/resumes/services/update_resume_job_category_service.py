"""이력서 직군(ResumeJobCategory) 업데이트 서비스.

name 문자열을 받아 공용 참조 테이블에 upsert 한 뒤 Resume.resume_job_category 에 연결한다.
빈 name 이면 FK 를 None 으로 해제한다.
"""

from common.services import BaseService
from resumes.models import ResumeJobCategory
from resumes.services.mixins import MarkResumeDirtyMixin


class UpdateResumeJobCategoryService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    name = (self.kwargs.get("name") or "").strip()

    if not name:
      resume.resume_job_category = None
      resume.save(update_fields=["resume_job_category", "updated_at"])
      self._mark_dirty()
      return None

    category = ResumeJobCategory.get_or_create_from_text(name)
    resume.resume_job_category = category
    resume.save(update_fields=["resume_job_category", "updated_at"])
    self._mark_dirty()
    return category
