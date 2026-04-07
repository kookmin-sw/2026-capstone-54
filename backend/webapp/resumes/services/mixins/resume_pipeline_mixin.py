"""이력서 서비스 공통 로직: Celery 파이프라인 발행, 임베딩 정리."""

from celery import current_app
from resumes.enums import AnalysisStatus, AnalysisStep
from resumes.models import ResumeEmbedding

PROCESS_RESUME_TASK = "store_resume.tasks.process_resume"


class ResumePipelineMixin:
  """이력서 Create/Update 서비스가 공유하는 파이프라인 관련 유틸리티."""

  def _dispatch_pipeline(self, resume, **extra_kwargs):
    """store-resume Celery 태스크를 발행한다."""
    current_app.send_task(
      PROCESS_RESUME_TASK,
      kwargs={
        "resume_uuid": str(resume.pk),
        "user_id": resume.user_id,
        **extra_kwargs,
      },
      queue="store-resume",
    )

  def _cleanup_embeddings_and_reset(self, resume):
    """기존 임베딩 삭제 + analysis 상태를 PENDING/QUEUED로 초기화한다."""
    ResumeEmbedding.objects.filter(resume=resume).delete()
    resume.analysis_status = AnalysisStatus.PENDING
    resume.analysis_step = AnalysisStep.QUEUED
    resume.save(update_fields=["analysis_status", "analysis_step", "updated_at"])
