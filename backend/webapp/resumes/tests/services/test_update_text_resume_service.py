from unittest.mock import patch

from django.test import TestCase
from resumes.enums import AnalysisStatus, AnalysisStep, ChunkType
from resumes.factories import TextResumeFactory
from resumes.models import ResumeEmbedding, ResumeTextContent
from resumes.services import UpdateTextResumeService
from users.factories import UserFactory


class UpdateTextResumeServiceTests(TestCase):
  """UpdateTextResumeService 단위 테스트."""

  def setUp(self):
    self.user = UserFactory()
    self.resume = TextResumeFactory(user=self.user, title="원래 제목")
    self.text_content = ResumeTextContent.objects.create(
      user=self.user,
      resume=self.resume,
      content="원래 내용",
    )

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_제목과_내용_모두_수정(self, mock_send_task):
    """제목과 내용을 모두 수정하면 임베딩이 삭제되고 Celery 태스크가 발행된다."""
    # 임베딩 2개 생성
    for i in range(2):
      ResumeEmbedding.objects.create(
        resume=self.resume,
        user=self.user,
        context=f"chunk {i}",
        chunk_type=ChunkType.TEXT,
        chunk_index=i,
      )

    result = UpdateTextResumeService(
      user=self.user,
      resume=self.resume,
      title="새 제목",
      content="새 내용",
    ).perform()

    result.refresh_from_db()
    self.assertEqual(result.title, "새 제목")
    self.assertEqual(result.text_content.content, "새 내용")
    self.assertEqual(ResumeEmbedding.objects.filter(resume=self.resume).count(), 0)
    self.assertEqual(result.analysis_status, AnalysisStatus.PENDING)
    self.assertEqual(result.analysis_step, AnalysisStep.QUEUED)
    mock_send_task.assert_called_once()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_제목만_수정_시_임베딩_유지(self, mock_send_task):
    """제목만 수정하면 임베딩이 유지되고 Celery 태스크가 발행되지 않는다."""
    # 임베딩 생성
    ResumeEmbedding.objects.create(
      resume=self.resume,
      user=self.user,
      context="chunk 0",
      chunk_type=ChunkType.TEXT,
      chunk_index=0,
    )
    # 분석 완료 상태로 설정
    self.resume.analysis_status = AnalysisStatus.COMPLETED
    self.resume.analysis_step = AnalysisStep.DONE
    self.resume.save()

    result = UpdateTextResumeService(
      user=self.user,
      resume=self.resume,
      title="변경된 제목",
    ).perform()

    result.refresh_from_db()
    self.assertEqual(result.title, "변경된 제목")
    self.assertEqual(result.text_content.content, "원래 내용")
    self.assertEqual(ResumeEmbedding.objects.filter(resume=self.resume).count(), 1)
    self.assertEqual(result.analysis_status, AnalysisStatus.COMPLETED)
    self.assertEqual(result.analysis_step, AnalysisStep.DONE)
    mock_send_task.assert_not_called()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_내용_수정_시_임베딩_삭제_및_celery_태스크_발행(self, mock_send_task):
    """내용 변경 시 임베딩 삭제, 상태 PENDING/QUEUED 초기화, Celery 태스크 발행."""
    # 임베딩 3개 생성
    for i in range(3):
      ResumeEmbedding.objects.create(
        resume=self.resume,
        user=self.user,
        context=f"chunk {i}",
        chunk_type=ChunkType.TEXT,
        chunk_index=i,
      )
    # 분석 완료 상태로 설정
    self.resume.analysis_status = AnalysisStatus.COMPLETED
    self.resume.analysis_step = AnalysisStep.DONE
    self.resume.save()

    result = UpdateTextResumeService(
      user=self.user,
      resume=self.resume,
      content="수정된 내용",
    ).perform()

    result.refresh_from_db()
    self.assertEqual(result.text_content.content, "수정된 내용")
    self.assertEqual(ResumeEmbedding.objects.filter(resume=self.resume).count(), 0)
    self.assertEqual(result.analysis_status, AnalysisStatus.PENDING)
    self.assertEqual(result.analysis_step, AnalysisStep.QUEUED)

    mock_send_task.assert_called_once()
    call_kwargs = mock_send_task.call_args
    self.assertEqual(call_kwargs.args[0], "store_resume.tasks.process_resume")
    self.assertEqual(call_kwargs.kwargs["kwargs"]["resume_uuid"], str(self.resume.pk))
    self.assertEqual(call_kwargs.kwargs["kwargs"]["text"], "수정된 내용")
    self.assertEqual(call_kwargs.kwargs["queue"], "store-resume")
