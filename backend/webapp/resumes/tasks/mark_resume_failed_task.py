"""이력서 분석 실패를 표시하는 태스크.

analysis-resume worker 가 복구 불가능한 오류를 만났을 때 이 태스크를 호출한다.
"""

import structlog
from common.tasks.base_task import BaseTask
from config.celery import app
from resumes.models import Resume

logger = structlog.get_logger(__name__)


class MarkResumeFailedTask(BaseTask):
  """`resumes.tasks.mark_resume_failed` 태스크 — analysis-resume → backend."""

  name = "resumes.tasks.mark_resume_failed"

  def run(self, resume_uuid: str, error: str | None = None, **_ignored):
    resume = Resume.objects.filter(pk=resume_uuid, deleted_at__isnull=True).first()
    if resume is None:
      logger.warning("mark_resume_failed_resume_missing", resume_uuid=resume_uuid)
      return None

    resume.mark_failed()
    logger.warning(
      "resume_marked_failed",
      resume_uuid=resume_uuid,
      error=error or "",
    )
    return resume.pk


RegisteredMarkResumeFailedTask = app.register_task(MarkResumeFailedTask())
