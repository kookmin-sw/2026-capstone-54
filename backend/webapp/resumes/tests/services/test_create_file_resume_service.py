from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from resumes.enums import ResumeType
from resumes.models import ResumeFileContent
from resumes.services import CreateFileResumeService
from users.factories import UserFactory


class CreateFileResumeServiceTests(TestCase):
  """CreateFileResumeService 테스트."""

  def setUp(self):
    self.user = UserFactory()
    self.pdf_file = SimpleUploadedFile(
      name="resume.pdf",
      content=b"%PDF-1.4 fake content",
      content_type="application/pdf",
    )

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_이력서_생성(self, mock_send_task):
    """파일 이력서와 ResumeFileContent가 생성된다."""
    resume = CreateFileResumeService(
      user=self.user,
      title="파일 이력서",
      file=self.pdf_file,
    ).perform()

    self.assertIsNotNone(resume.pk)
    self.assertEqual(resume.type, ResumeType.FILE)
    self.assertTrue(ResumeFileContent.objects.filter(resume=resume).exists())

    file_content = ResumeFileContent.objects.get(resume=resume)
    self.assertEqual(file_content.original_filename, "resume.pdf")
    self.assertEqual(file_content.mime_type, "application/pdf")

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_celery_태스크_발행(self, mock_send_task):
    """store-resume 파이프라인 태스크가 발행된다."""
    CreateFileResumeService(
      user=self.user,
      title="파일 이력서",
      file=self.pdf_file,
    ).perform()

    mock_send_task.assert_called_once()
    call_kwargs = mock_send_task.call_args
    self.assertEqual(call_kwargs.kwargs["kwargs"]["type"], "file")
    self.assertIn("storage_path", call_kwargs.kwargs["kwargs"])
