"""이력서 분석 진행 단계를 갱신하는 태스크.

analysis-resume worker 가 각 단계 전환 시점에 이 태스크를 호출해 SSE 에 실시간
진행 상태가 반영되도록 한다.
"""

import structlog
from common.tasks.base_task import BaseTask
from config.celery import app
from resumes.enums import AnalysisStatus
from resumes.models import Resume

logger = structlog.get_logger(__name__)


class UpdateResumeStepTask(BaseTask):
  """`resumes.tasks.update_resume_step` 태스크 — analysis-resume → backend."""

  name = "resumes.tasks.update_resume_step"

  def run(self, resume_uuid: str, step: str, **_ignored):
    resume = Resume.objects.filter(pk=resume_uuid, deleted_at__isnull=True).first()
    if resume is None:
      logger.warning("update_resume_step_resume_missing", resume_uuid=resume_uuid)
      return None

    # 상태가 completed / failed 로 이미 전환된 경우는 단계 갱신을 무시한다.
    if resume.analysis_status in (AnalysisStatus.COMPLETED, AnalysisStatus.FAILED):
      return resume.pk

    # 첫 단계 진입 시 pending → processing 로 함께 전환
    if resume.analysis_status == AnalysisStatus.PENDING:
      resume.mark_processing(step=step)
    else:
      resume.mark_step(step)
    return resume.pk


RegisteredUpdateResumeStepTask = app.register_task(UpdateResumeStepTask())
