"""구조화 폼으로 직접 입력된 이력서를 생성한다.

text/file 원본 없이 사용자가 정규화 폼에 직접 작성한 이력서.
- Resume 메타 생성 (source_mode=structured)
- ResumeParsedDataWriter 로 정규화 sub-model 일괄 저장
- bundle 업로드 후 reembed_resume 태스크 dispatch (structured 모드는 LLM 분석 불필요,
  임베딩만 수행)
"""

from common.services import BaseService
from resumes.enums import AnalysisStatus, AnalysisStep, ResumeSourceMode, ResumeType
from resumes.models import Resume
from resumes.services.mixins import ResumePipelineMixin
from resumes.services.resume_parsed_data_writer import ResumeParsedDataWriter
from resumes.services.upload_resume_bundle_service import UploadResumeBundleService


class CreateStructuredResumeService(ResumePipelineMixin, BaseService):
  """type=structured 이력서 생성."""

  required_value_kwargs = ["title", "parsed_data"]

  def execute(self):
    resume = Resume.objects.create(
      user=self.user,
      type=ResumeType.STRUCTURED,
      title=self.kwargs["title"],
      source_mode=ResumeSourceMode.STRUCTURED,
      analysis_status=AnalysisStatus.PROCESSING,
      analysis_step=AnalysisStep.EMBEDDING,
      is_parsed=True,
    )

    # 정규화 sub-model 즉시 채움
    ResumeParsedDataWriter(resume=resume, parsed_data=self.kwargs["parsed_data"]).write()

    # bundle 업로드 후 reembed 태스크 dispatch
    bundle_url = UploadResumeBundleService(resume=resume).perform()
    self._dispatch_reembed_pipeline(resume, bundle_url=bundle_url)

    return resume
