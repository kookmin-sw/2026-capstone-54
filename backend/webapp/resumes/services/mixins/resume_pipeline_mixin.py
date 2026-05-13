"""이력서 서비스 공통 로직: Celery 파이프라인 발행, 임베딩 정리."""

from celery import current_app
from resumes.enums import AnalysisStatus, AnalysisStep
from resumes.models import ResumeEmbedding

PROCESS_RESUME_TASK = "analysis_resume.tasks.process_resume"
REEMBED_RESUME_TASK = "analysis_resume.tasks.reembed_resume"
ANALYSIS_RESUME_QUEUE = "analysis-resume"


class ResumePipelineMixin:
  """이력서 Create/Update 서비스가 공유하는 파이프라인 관련 유틸리티."""

  def _dispatch_pipeline(self, resume, **extra_kwargs):
    """analysis-resume Celery 태스크(process_resume)를 발행한다.

    신규 text/file 이력서가 생성/갱신될 때 호출된다.
    """
    current_app.send_task(
      PROCESS_RESUME_TASK,
      kwargs={
        "resume_uuid": str(resume.pk),
        "user_id": resume.user_id,
        **extra_kwargs,
      },
      queue=ANALYSIS_RESUME_QUEUE,
    )

  def _dispatch_reembed_pipeline(self, resume, *, bundle_url: str):
    """analysis-resume Celery 태스크(reembed_resume)를 발행한다.

    섹션 편집 후 최종 저장 시 bundle URL 을 전달해 임베딩만 재생성한다.
    """
    current_app.send_task(
      REEMBED_RESUME_TASK,
      kwargs={
        "resume_uuid": str(resume.pk),
        "user_id": resume.user_id,
        "bundle_url": bundle_url,
      },
      queue=ANALYSIS_RESUME_QUEUE,
    )

  def _cleanup_embeddings_and_reset(self, resume):
    """기존 임베딩 삭제 + analysis 상태를 PENDING/QUEUED로 초기화한다."""
    ResumeEmbedding.objects.filter(resume=resume).delete()
    resume.analysis_status = AnalysisStatus.PENDING
    resume.analysis_step = AnalysisStep.QUEUED
    resume.save(update_fields=["analysis_status", "analysis_step", "updated_at"])
