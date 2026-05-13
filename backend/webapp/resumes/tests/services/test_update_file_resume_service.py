from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from resumes.enums import AnalysisStatus, AnalysisStep, ChunkType
from resumes.factories import FileResumeFactory
from resumes.models import ResumeEmbedding, ResumeFileContent
from resumes.services import UpdateFileResumeService
from users.factories import UserFactory


class UpdateFileResumeServiceTests(TestCase):
  """UpdateFileResumeService 단위 테스트."""

  def setUp(self):
    self.user = UserFactory()
    self.resume = FileResumeFactory(user=self.user, title="원래 제목")
    self.file_content = ResumeFileContent.objects.create(
      user=self.user,
      resume=self.resume,
      original_filename="original.pdf",
      storage_path="resumes/old/path.pdf",
      file_size_bytes=1024,
      mime_type="application/pdf",
    )
    # 분석 완료 상태로 설정
    self.resume.analysis_status = AnalysisStatus.COMPLETED
    self.resume.analysis_step = AnalysisStep.DONE
    self.resume.save()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  @patch(
    "resumes.services.mixins.file_resume_pipeline_mixin.default_storage.save", return_value="resumes/test/path.pdf"
  )
  def test_제목_수정_시_임베딩_유지_및_celery_미발행(self, mock_storage_save, mock_send_task):
    """제목만 수정하면 임베딩이 유지되고 Celery 태스크가 발행되지 않는다."""
    # 임베딩 2개 생성
    for i in range(2):
      ResumeEmbedding.objects.create(
        resume=self.resume,
        user=self.user,
        context=f"chunk {i}",
        chunk_type=ChunkType.TEXT,
        chunk_index=i,
      )

    result = UpdateFileResumeService(
      user=self.user,
      resume=self.resume,
      title="변경된 제목",
    ).perform()

    result.refresh_from_db()
    self.assertEqual(result.title, "변경된 제목")
    self.assertEqual(ResumeEmbedding.objects.filter(resume=self.resume).count(), 2)
    self.assertEqual(result.analysis_status, AnalysisStatus.COMPLETED)
    self.assertEqual(result.analysis_step, AnalysisStep.DONE)
    mock_storage_save.assert_not_called()
    mock_send_task.assert_not_called()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  @patch(
    "resumes.services.mixins.file_resume_pipeline_mixin.default_storage.save", return_value="resumes/test/path.pdf"
  )
  def test_새_파일_업로드_시_s3_업로드_및_file_content_업데이트(self, mock_storage_save, mock_send_task):
    """새 파일 업로드 시 S3에 업로드되고 ResumeFileContent가 업데이트된다."""
    new_file = SimpleUploadedFile(
      name="new_resume.pdf",
      content=b"%PDF-1.4 new content",
      content_type="application/pdf",
    )

    UpdateFileResumeService(
      user=self.user,
      resume=self.resume,
      file=new_file,
    ).perform()

    mock_storage_save.assert_called_once()

    self.file_content.refresh_from_db()
    self.assertEqual(self.file_content.original_filename, "new_resume.pdf")
    self.assertEqual(self.file_content.storage_path, "resumes/test/path.pdf")
    self.assertEqual(self.file_content.file_size_bytes, new_file.size)
    self.assertEqual(self.file_content.mime_type, "application/pdf")

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  @patch(
    "resumes.services.mixins.file_resume_pipeline_mixin.default_storage.save", return_value="resumes/test/path.pdf"
  )
  def test_파일_업로드_시_임베딩_삭제_및_celery_태스크_발행(self, mock_storage_save, mock_send_task):
    """파일 업로드 시 임베딩이 삭제되고 상태가 초기화되며 Celery 태스크가 발행된다."""
    # 임베딩 3개 생성
    for i in range(3):
      ResumeEmbedding.objects.create(
        resume=self.resume,
        user=self.user,
        context=f"chunk {i}",
        chunk_type=ChunkType.TEXT,
        chunk_index=i,
      )

    new_file = SimpleUploadedFile(
      name="updated.pdf",
      content=b"%PDF-1.4 updated content",
      content_type="application/pdf",
    )

    result = UpdateFileResumeService(
      user=self.user,
      resume=self.resume,
      file=new_file,
    ).perform()

    # 임베딩 삭제 확인
    self.assertEqual(ResumeEmbedding.objects.filter(resume=self.resume).count(), 0)

    # 상태 초기화 확인
    result.refresh_from_db()
    self.assertEqual(result.analysis_status, AnalysisStatus.PENDING)
    self.assertEqual(result.analysis_step, AnalysisStep.QUEUED)

    # Celery 태스크 발행 확인
    mock_send_task.assert_called_once()
    call_kwargs = mock_send_task.call_args
    self.assertEqual(call_kwargs.args[0], "analysis_resume.tasks.process_resume")
    self.assertEqual(call_kwargs.kwargs["kwargs"]["resume_uuid"], str(self.resume.pk))
    self.assertEqual(call_kwargs.kwargs["kwargs"]["user_id"], self.user.id)
    self.assertEqual(call_kwargs.kwargs["kwargs"]["type"], "file")
    self.assertEqual(call_kwargs.kwargs["kwargs"]["storage_path"], "media/resumes/test/path.pdf")
    self.assertEqual(call_kwargs.kwargs["queue"], "analysis-resume")
