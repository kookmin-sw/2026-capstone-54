"""Resume CRUD 속성 기반 테스트 (Property-Based Tests) — 서비스/모델 레벨.

- 서비스 직접 호출 및 모델 매니저 검증.
"""

from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from resumes.enums import AnalysisStatus, AnalysisStep, ChunkType, ResumeType
from resumes.factories import FileResumeFactory, TextResumeFactory
from resumes.models import ResumeEmbedding, ResumeFileContent, ResumeTextContent
from resumes.models.file_resume import FileResume
from resumes.models.text_resume import TextResume
from resumes.services import UpdateFileResumeService, UpdateTextResumeService
from users.factories import UserFactory

safe_text = st.text(
  min_size=1,
  max_size=100,
  alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Lo")),
)


def _verified_user(**kwargs):
  return UserFactory(email_confirmed_at=timezone.now(), **kwargs)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property4ContentUpdateClearsEmbeddingsTests(TestCase):
  """Property: 내용 수정 시 임베딩 정리 및 상태 초기화."""

  @given(n_embeddings=st.integers(min_value=0, max_value=5), new_content=safe_text)
  @settings(max_examples=5, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_content_update_clears_embeddings(self, mock_send_task, n_embeddings, new_content):
    """Feature: resume-crud-api, Property: 내용 수정 시 임베딩 정리 및 상태 초기화

    **Validates: Requirements 2.2, 2.3, 3.2, 3.3, 7.1, 7.2**
    """
    user = _verified_user()
    resume = TextResumeFactory(user=user, title="test")
    ResumeTextContent.objects.create(user=user, resume=resume, content="old content")
    resume.analysis_status = AnalysisStatus.COMPLETED
    resume.analysis_step = AnalysisStep.DONE
    resume.save()

    for i in range(n_embeddings):
      ResumeEmbedding.objects.create(
        resume=resume,
        user=user,
        context=f"chunk {i}",
        chunk_type=ChunkType.TEXT,
        chunk_index=i,
      )

    UpdateTextResumeService(user=user, resume=resume, content=new_content).perform()

    resume.refresh_from_db()
    self.assertEqual(ResumeEmbedding.objects.filter(resume=resume).count(), 0)
    self.assertEqual(resume.analysis_status, AnalysisStatus.PENDING)
    self.assertEqual(resume.analysis_step, AnalysisStep.QUEUED)
    mock_send_task.assert_called_once()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property5TitleOnlyUpdatePreservesEmbeddingsTests(TestCase):
  """Property: 제목만 수정 시 임베딩 유지."""

  @given(n_embeddings=st.integers(min_value=0, max_value=5), new_title=safe_text)
  @settings(max_examples=5, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_title_only_update_preserves_embeddings(self, mock_send_task, n_embeddings, new_title):
    """Feature: resume-crud-api, Property: 제목만 수정 시 임베딩 유지

    **Validates: Requirements 3.4, 7.3**
    """
    user = _verified_user()
    resume = TextResumeFactory(user=user, title="original")
    ResumeTextContent.objects.create(user=user, resume=resume, content="content")
    resume.analysis_status = AnalysisStatus.COMPLETED
    resume.analysis_step = AnalysisStep.DONE
    resume.save()
    original_status = resume.analysis_status
    original_step = resume.analysis_step

    for i in range(n_embeddings):
      ResumeEmbedding.objects.create(
        resume=resume,
        user=user,
        context=f"chunk {i}",
        chunk_type=ChunkType.TEXT,
        chunk_index=i,
      )

    UpdateTextResumeService(user=user, resume=resume, title=new_title).perform()

    resume.refresh_from_db()
    self.assertEqual(resume.title, new_title)
    self.assertEqual(ResumeEmbedding.objects.filter(resume=resume).count(), n_embeddings)
    self.assertEqual(resume.analysis_status, original_status)
    self.assertEqual(resume.analysis_step, original_step)
    mock_send_task.assert_not_called()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property8ProxyModelFilteringTests(TestCase):
  """Property: 프록시 모델 타입 필터링."""

  @given(n_text=st.integers(min_value=0, max_value=3), n_file=st.integers(min_value=0, max_value=3))
  @settings(max_examples=5, deadline=None)
  def test_proxy_model_filtering(self, n_text, n_file):
    """Feature: resume-crud-api, Property: 프록시 모델 타입 필터링

    **Validates: Requirement 9.2**
    """
    user = _verified_user()
    for _ in range(n_text):
      TextResumeFactory(user=user)
    for _ in range(n_file):
      FileResumeFactory(user=user)

    text_qs = TextResume.objects.filter(user=user)
    file_qs = FileResume.objects.filter(user=user)

    self.assertEqual(text_qs.count(), n_text)
    self.assertEqual(file_qs.count(), n_file)
    for r in text_qs:
      self.assertEqual(r.type, ResumeType.TEXT)
    for r in file_qs:
      self.assertEqual(r.type, ResumeType.FILE)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property9FileResumeContentUpdateTests(TestCase):
  """Property: 파일 이력서 수정 시 ResumeFileContent 업데이트."""

  @given(
    new_filename=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd"))),
    file_size=st.integers(min_value=1, max_value=10_000_000),
  )
  @settings(max_examples=5, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  @patch(
    "resumes.services.mixins.file_resume_pipeline_mixin.default_storage.save", return_value="resumes/test/path.pdf"
  )
  def test_file_resume_content_update(self, mock_storage_save, mock_send_task, new_filename, file_size):
    """Feature: resume-crud-api, Property: 파일 이력서 수정 시 ResumeFileContent 업데이트

    **Validates: Requirement 3.1**
    """
    user = _verified_user()
    resume = FileResumeFactory(user=user, title="file resume")
    ResumeFileContent.objects.create(
      user=user,
      resume=resume,
      original_filename="old_file.pdf",
      storage_path="resumes/old/path.pdf",
      file_size_bytes=999,
      mime_type="application/pdf",
    )

    filename_with_ext = f"{new_filename}.pdf"
    fake_file = SimpleUploadedFile(filename_with_ext, b"x" * file_size, content_type="application/pdf")

    UpdateFileResumeService(user=user, resume=resume, file=fake_file).perform()

    file_content = ResumeFileContent.objects.get(resume=resume)
    self.assertEqual(file_content.original_filename, filename_with_ext)
    self.assertEqual(file_content.storage_path, "resumes/test/path.pdf")
    self.assertEqual(file_content.file_size_bytes, file_size)
