from django.test import TestCase
from resumes.enums import AnalysisStatus, AnalysisStep, ResumeType
from resumes.factories import FileResumeFactory, ResumeFactory, TextResumeFactory


class ResumeModelTests(TestCase):
  """Resume 모델 테스트."""

  def test_생성시_기본_상태(self):
    resume = ResumeFactory()
    self.assertEqual(resume.analysis_status, AnalysisStatus.PENDING)
    self.assertEqual(resume.analysis_step, AnalysisStep.QUEUED)
    self.assertFalse(resume.is_parsed)
    self.assertTrue(resume.is_active)
    self.assertIsNotNone(resume.uuid)

  def test_uuid가_pk로_사용됨(self):
    resume = ResumeFactory()
    self.assertEqual(resume.pk, resume.uuid)

  def test_mark_processing(self):
    resume = ResumeFactory()
    resume.mark_processing(step=AnalysisStep.EXTRACTING_TEXT)
    resume.refresh_from_db()
    self.assertEqual(resume.analysis_status, AnalysisStatus.PROCESSING)
    self.assertEqual(resume.analysis_step, AnalysisStep.EXTRACTING_TEXT)

  def test_mark_step(self):
    resume = ResumeFactory()
    resume.mark_step(AnalysisStep.EMBEDDING)
    resume.refresh_from_db()
    self.assertEqual(resume.analysis_step, AnalysisStep.EMBEDDING)

  def test_mark_completed(self):
    resume = ResumeFactory()
    parsed = {"skills": ["Python"]}
    resume.mark_completed(parsed_data=parsed)
    resume.refresh_from_db()
    self.assertEqual(resume.analysis_status, AnalysisStatus.COMPLETED)
    self.assertEqual(resume.analysis_step, AnalysisStep.DONE)
    self.assertTrue(resume.is_parsed)
    self.assertIsNotNone(resume.analyzed_at)
    self.assertEqual(resume.parsed_data, parsed)

  def test_mark_failed(self):
    resume = ResumeFactory()
    resume.mark_failed()
    resume.refresh_from_db()
    self.assertEqual(resume.analysis_status, AnalysisStatus.FAILED)
    self.assertIsNone(resume.analyzed_at)

  def test_소프트_삭제(self):
    resume = ResumeFactory()
    pk = resume.pk
    resume.delete()
    from resumes.models import Resume
    self.assertFalse(Resume.objects.filter(pk=pk).exists())
    self.assertTrue(Resume.all_objects.filter(pk=pk).exists())


class TextResumeProxyTests(TestCase):
  """TextResume proxy 모델 테스트."""

  def test_생성시_type이_text(self):
    resume = TextResumeFactory()
    self.assertEqual(resume.type, ResumeType.TEXT)

  def test_매니저가_text만_반환(self):
    TextResumeFactory()
    FileResumeFactory()
    from resumes.models import TextResume
    self.assertEqual(TextResume.objects.count(), 1)


class FileResumeProxyTests(TestCase):
  """FileResume proxy 모델 테스트."""

  def test_생성시_type이_file(self):
    resume = FileResumeFactory()
    self.assertEqual(resume.type, ResumeType.FILE)

  def test_매니저가_file만_반환(self):
    TextResumeFactory()
    FileResumeFactory()
    from resumes.models import FileResume
    self.assertEqual(FileResume.objects.count(), 1)
