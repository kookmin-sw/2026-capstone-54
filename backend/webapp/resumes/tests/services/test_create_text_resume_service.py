from unittest.mock import patch

from django.test import TestCase
from resumes.enums import AnalysisStatus, ResumeType
from resumes.models import Resume, ResumeTextContent
from resumes.services import CreateTextResumeService
from users.factories import UserFactory


class CreateTextResumeServiceTests(TestCase):
  """CreateTextResumeService 테스트."""

  def setUp(self):
    self.user = UserFactory()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_이력서_생성(self, mock_send_task):
    """텍스트 이력서와 ResumeTextContent가 생성된다."""
    resume = CreateTextResumeService(
      user=self.user,
      title="백엔드 개발자",
      content="Python Django 경험",
    ).perform()

    self.assertIsNotNone(resume.pk)
    self.assertEqual(resume.type, ResumeType.TEXT)
    self.assertEqual(resume.title, "백엔드 개발자")
    self.assertEqual(resume.analysis_status, AnalysisStatus.PENDING)
    self.assertTrue(ResumeTextContent.objects.filter(resume=resume).exists())

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_celery_태스크_발행(self, mock_send_task):
    """store-resume 파이프라인 태스크가 발행된다."""
    resume = CreateTextResumeService(
      user=self.user,
      title="이력서",
      content="내용",
    ).perform()

    mock_send_task.assert_called_once()
    call_kwargs = mock_send_task.call_args
    self.assertEqual(call_kwargs.args[0], "store_resume.tasks.process_resume")
    self.assertEqual(call_kwargs.kwargs["kwargs"]["resume_uuid"], str(resume.pk))
    self.assertEqual(call_kwargs.kwargs["queue"], "store-resume")

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_여러_이력서_생성_가능(self, mock_send_task):
    """같은 사용자가 여러 이력서를 생성할 수 있다."""
    for i in range(3):
      CreateTextResumeService(
        user=self.user,
        title=f"이력서 {i}",
        content=f"내용 {i}",
      ).perform()

    self.assertEqual(Resume.objects.filter(user=self.user).count(), 3)
