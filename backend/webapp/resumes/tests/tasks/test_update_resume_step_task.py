"""UpdateResumeStepTask 테스트."""

from django.test import TestCase
from resumes.enums import AnalysisStatus, AnalysisStep
from resumes.factories import ResumeFactory
from resumes.tasks import UpdateResumeStepTask


class UpdateResumeStepTaskTests(TestCase):
  """resumes.tasks.update_resume_step 태스크."""

  def test_pending_transitions_to_processing(self):
    """pending 상태에서 단계 업데이트 시 processing 으로 함께 전환된다."""
    resume = ResumeFactory(
      analysis_status=AnalysisStatus.PENDING,
      analysis_step=AnalysisStep.QUEUED,
    )

    UpdateResumeStepTask().run(resume_uuid=str(resume.pk), step=AnalysisStep.EXTRACTING_TEXT)

    resume.refresh_from_db()
    self.assertEqual(resume.analysis_status, AnalysisStatus.PROCESSING)
    self.assertEqual(resume.analysis_step, AnalysisStep.EXTRACTING_TEXT)

  def test_processing_updates_step_only(self):
    """이미 processing 이면 step 만 갱신한다."""
    resume = ResumeFactory(
      analysis_status=AnalysisStatus.PROCESSING,
      analysis_step=AnalysisStep.EXTRACTING_TEXT,
    )

    UpdateResumeStepTask().run(resume_uuid=str(resume.pk), step=AnalysisStep.EMBEDDING)

    resume.refresh_from_db()
    self.assertEqual(resume.analysis_status, AnalysisStatus.PROCESSING)
    self.assertEqual(resume.analysis_step, AnalysisStep.EMBEDDING)

  def test_completed_resume_is_not_downgraded(self):
    """이미 completed 상태인 이력서는 단계 업데이트 요청을 무시한다."""
    resume = ResumeFactory(
      analysis_status=AnalysisStatus.COMPLETED,
      analysis_step=AnalysisStep.DONE,
    )

    UpdateResumeStepTask().run(resume_uuid=str(resume.pk), step=AnalysisStep.EMBEDDING)

    resume.refresh_from_db()
    self.assertEqual(resume.analysis_status, AnalysisStatus.COMPLETED)
    self.assertEqual(resume.analysis_step, AnalysisStep.DONE)

  def test_missing_resume_returns_none(self):
    """존재하지 않는 uuid 는 None 반환하고 예외는 던지지 않는다."""
    result = UpdateResumeStepTask().run(
      resume_uuid="00000000-0000-0000-0000-000000000000",
      step=AnalysisStep.EXTRACTING_TEXT,
    )
    self.assertIsNone(result)
