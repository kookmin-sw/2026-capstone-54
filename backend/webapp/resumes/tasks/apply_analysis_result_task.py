"""이력서 분석 결과 payload 를 Django ORM 에 영속화하는 태스크.

analysis-resume(구 store-resume) worker 가 LLM 분석을 마친 뒤 이 태스크를
`send_task("resumes.tasks.apply_analysis_result", queue="celery", kwargs=payload)`
로 호출한다. backend celery worker 가 이를 수신해 `ApplyAnalysisResultService` 로
Resume 상태 전환 + 정규화 sub-model 생성 + 임베딩 / 토큰 사용량 기록을 처리한다.
"""

import structlog
from common.tasks.base_task import BaseTask
from config.celery import app
from resumes.models import Resume
from resumes.services import ApplyAnalysisResultService

logger = structlog.get_logger(__name__)


class ApplyAnalysisResultTask(BaseTask):
  """`resumes.tasks.apply_analysis_result` 태스크 — analysis-resume → backend."""

  name = "resumes.tasks.apply_analysis_result"

  def run(
    self,
    resume_uuid: str,
    parsed_data: dict | None = None,
    embeddings: list[dict] | None = None,
    file_text_content: str | None = None,
    token_usages: list[dict] | None = None,
    **_ignored,
  ):
    resume = Resume.objects.filter(pk=resume_uuid, deleted_at__isnull=True).first()
    if resume is None:
      logger.warning("apply_analysis_result_resume_missing", resume_uuid=resume_uuid)
      return None

    ApplyAnalysisResultService(
      resume=resume,
      parsed_data=parsed_data,
      embeddings=embeddings,
      file_text_content=file_text_content,
      token_usages=token_usages,
    ).perform()
    return resume.pk


RegisteredApplyAnalysisResultTask = app.register_task(ApplyAnalysisResultTask())
