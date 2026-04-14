"""MarkResumeFailedTask 테스트."""

from django.test import TestCase
from resumes.enums import AnalysisStatus
from resumes.factories import ResumeFactory
from resumes.tasks import MarkResumeFailedTask


class MarkResumeFailedTaskTests(TestCase):
  """resumes.tasks.mark_resume_failed 태스크."""

  def test_marks_resume_failed(self):
    """status 가 failed 로 전환되고 analyzed_at 은 None 이 된다."""
    resume = ResumeFactory(analysis_status=AnalysisStatus.PROCESSING)

    MarkResumeFailedTask().run(resume_uuid=str(resume.pk), error="LLM timeout")

    resume.refresh_from_db()
    self.assertEqual(resume.analysis_status, AnalysisStatus.FAILED)
    self.assertIsNone(resume.analyzed_at)

  def test_missing_resume_returns_none(self):
    """존재하지 않는 uuid 는 None 반환."""
    result = MarkResumeFailedTask().run(resume_uuid="00000000-0000-0000-0000-000000000000", error="")
    self.assertIsNone(result)
