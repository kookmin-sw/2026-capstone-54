"""사용자가 '최종 저장' 을 누른 시점에 호출되는 서비스.

- bundle JSON 업로드
- analysis-resume reembed_resume 태스크 dispatch (기존 임베딩 정리 후 재생성)
- Resume.is_dirty=False, last_finalized_at=now()
"""

from common.services import BaseService
from resumes.models import Resume, ResumeEmbedding
from resumes.services.mixins import ResumePipelineMixin
from resumes.services.upload_resume_bundle_service import UploadResumeBundleService


class FinalizeResumeService(ResumePipelineMixin, BaseService):
  """이력서 최종 저장(재임베딩 트리거)."""

  required_value_kwargs = ["resume"]

  def execute(self):
    resume: Resume = self.kwargs["resume"]

    # 1) 기존 임베딩 제거 (apply_analysis_result 가 어차피 다시 bulk_create 하지만,
    #    재임베딩 진행 중에 검색되면 부분 결과가 노출될 수 있어 선제 정리)
    ResumeEmbedding.objects.filter(resume=resume).delete()

    # 2) bundle 업로드
    bundle_url = UploadResumeBundleService(resume=resume).perform()

    # 3) reembed 태스크 dispatch
    self._dispatch_reembed_pipeline(resume, bundle_url=bundle_url)

    # 4) 상태 전환 — is_dirty 해제 + 마지막 finalize 시각 기록
    resume.mark_finalized()
    return resume
