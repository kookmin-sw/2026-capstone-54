"""Resume CRUD API 속성 기반 테스트 (Property-Based Tests).

hypothesis 라이브러리를 사용하여 9개의 정확성 속성을 검증한다.
"""

from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.enums import AnalysisStatus, AnalysisStep, ChunkType, ResumeType
from resumes.factories import FileResumeFactory, TextResumeFactory
from resumes.models import Resume, ResumeEmbedding, ResumeFileContent, ResumeTextContent
from resumes.models.file_resume import FileResume
from resumes.models.text_resume import TextResume
from resumes.services import UpdateFileResumeService
from users.factories import UserFactory

# 한국어 안전 텍스트 전략
safe_text = st.text(
  min_size=1,
  max_size=100,
  alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Lo")),
)


def _make_auth_client(user):
  """JWT 인증이 설정된 APIClient를 반환한다."""
  client = APIClient()
  token = RefreshToken.for_user(user)
  client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
  return client


def _verified_user(**kwargs):
  """이메일 인증이 완료된 사용자를 생성한다."""
  user = UserFactory(email_confirmed_at=timezone.now(), **kwargs)
  return user


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property1ReadRoundTripTests(TestCase):
  """Property 1: 이력서 조회 round-trip."""

  @given(title=safe_text)
  @settings(max_examples=100, deadline=None)
  def test_read_round_trip(self, title):
    """Feature: resume-crud-api, Property 1: 이력서 조회 round-trip

        이력서 생성 후 해당 UUID로 GET 요청 시 title, type, analysis_status가 동일하게 반환된다.

        **Validates: Requirements 1.1**
        """
    user = _verified_user()
    client = _make_auth_client(user)

    resume = TextResumeFactory(user=user, title=title)
    ResumeTextContent.objects.create(user=user, resume=resume, content="test content")

    url = reverse("resume-detail", kwargs={"uuid": resume.pk})
    response = client.get(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["title"], title)
    self.assertEqual(response.data["type"], ResumeType.TEXT)
    self.assertEqual(response.data["analysis_status"], AnalysisStatus.PENDING)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property2OwnershipTests(TestCase):
  """Property 2: 소유권 검증 — 타인 이력서 접근 불가."""

  @given(title=safe_text)
  @settings(max_examples=100, deadline=None)
  def test_other_user_cannot_access(self, title):
    """Feature: resume-crud-api, Property 2: 소유권 검증 — 타인 이력서 접근 불가

        사용자 A 소유 이력서에 사용자 B가 GET/PUT/PATCH/DELETE 요청 시 모두 404를 반환한다.

        **Validates: Requirements 1.2, 2.5, 3.5, 4.4**
        """
    user_a = _verified_user()
    user_b = _verified_user()
    client_b = _make_auth_client(user_b)

    resume = TextResumeFactory(user=user_a, title=title)
    ResumeTextContent.objects.create(user=user_a, resume=resume, content="content")

    url = reverse("resume-detail", kwargs={"uuid": resume.pk})

    # GET
    self.assertEqual(client_b.get(url).status_code, status.HTTP_404_NOT_FOUND)
    # PUT
    self.assertEqual(
      client_b.put(url, {
        "title": "hack"
      }, format="json").status_code,
      status.HTTP_404_NOT_FOUND,
    )
    # PATCH
    self.assertEqual(
      client_b.patch(url, {
        "title": "hack"
      }, format="json").status_code,
      status.HTTP_404_NOT_FOUND,
    )
    # DELETE
    self.assertEqual(client_b.delete(url).status_code, status.HTTP_404_NOT_FOUND)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property3TextUpdateRoundTripTests(TestCase):
  """Property 3: 텍스트 이력서 수정 round-trip."""

  @given(new_title=safe_text, new_content=safe_text)
  @settings(max_examples=100, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_text_update_round_trip(self, mock_send_task, new_title, new_content):
    """Feature: resume-crud-api, Property 3: 텍스트 이력서 수정 round-trip

        PUT/PATCH 수정 후 GET 조회 시 수정된 필드가 반영되고,
        PATCH 시 미포함 필드는 기존 값을 유지한다.

        **Validates: Requirements 2.1, 2.4**
        """
    user = _verified_user()
    client = _make_auth_client(user)

    resume = TextResumeFactory(user=user, title="original title")
    ResumeTextContent.objects.create(user=user, resume=resume, content="original content")

    url = reverse("resume-detail", kwargs={"uuid": resume.pk})

    # PUT: 제목+내용 모두 수정
    put_resp = client.put(url, {"title": new_title, "content": new_content}, format="json")
    self.assertEqual(put_resp.status_code, status.HTTP_200_OK)

    get_resp = client.get(url)
    self.assertEqual(get_resp.data["title"], new_title)
    self.assertEqual(get_resp.data["content"], new_content)

    # PATCH: 제목만 수정 → content는 이전 값(new_content) 유지
    patch_title = new_title + "v2"
    patch_resp = client.patch(url, {"title": patch_title}, format="json")
    self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)

    get_resp2 = client.get(url)
    self.assertEqual(get_resp2.data["title"], patch_title)
    self.assertEqual(get_resp2.data["content"], new_content)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property4ContentUpdateClearsEmbeddingsTests(TestCase):
  """Property 4: 내용 수정 시 임베딩 정리 및 상태 초기화."""

  @given(n_embeddings=st.integers(min_value=0, max_value=5), new_content=safe_text)
  @settings(max_examples=100, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_content_update_clears_embeddings(self, mock_send_task, n_embeddings, new_content):
    """Feature: resume-crud-api, Property 4: 내용 수정 시 임베딩 정리 및 상태 초기화

        내용 수정 시 ResumeEmbedding 수가 0이 되고,
        analysis_status=PENDING, analysis_step=QUEUED로 초기화된다.

        **Validates: Requirements 2.2, 2.3, 3.2, 3.3, 7.1, 7.2**
        """
    user = _verified_user()

    resume = TextResumeFactory(user=user, title="test")
    ResumeTextContent.objects.create(user=user, resume=resume, content="old content")

    # 분석 완료 상태로 설정
    resume.analysis_status = AnalysisStatus.COMPLETED
    resume.analysis_step = AnalysisStep.DONE
    resume.save()

    # N개의 임베딩 생성
    for i in range(n_embeddings):
      ResumeEmbedding.objects.create(
        resume=resume,
        user=user,
        context=f"chunk {i}",
        chunk_type=ChunkType.TEXT,
        chunk_index=i,
      )

    from resumes.services import UpdateTextResumeService

    UpdateTextResumeService(
      user=user,
      resume=resume,
      content=new_content,
    ).perform()

    resume.refresh_from_db()
    self.assertEqual(ResumeEmbedding.objects.filter(resume=resume).count(), 0)
    self.assertEqual(resume.analysis_status, AnalysisStatus.PENDING)
    self.assertEqual(resume.analysis_step, AnalysisStep.QUEUED)
    mock_send_task.assert_called_once()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property5TitleOnlyUpdatePreservesEmbeddingsTests(TestCase):
  """Property 5: 제목만 수정 시 임베딩 유지."""

  @given(n_embeddings=st.integers(min_value=0, max_value=5), new_title=safe_text)
  @settings(max_examples=100, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_title_only_update_preserves_embeddings(self, mock_send_task, n_embeddings, new_title):
    """Feature: resume-crud-api, Property 5: 제목만 수정 시 임베딩 유지

        제목만 수정 시 ResumeEmbedding 수가 N으로 유지되고,
        analysis_status/analysis_step이 변경되지 않는다.

        **Validates: Requirements 3.4, 7.3**
        """
    user = _verified_user()

    resume = TextResumeFactory(user=user, title="original")
    ResumeTextContent.objects.create(user=user, resume=resume, content="content")

    # 분석 완료 상태로 설정
    resume.analysis_status = AnalysisStatus.COMPLETED
    resume.analysis_step = AnalysisStep.DONE
    resume.save()

    original_status = resume.analysis_status
    original_step = resume.analysis_step

    # N개의 임베딩 생성
    for i in range(n_embeddings):
      ResumeEmbedding.objects.create(
        resume=resume,
        user=user,
        context=f"chunk {i}",
        chunk_type=ChunkType.TEXT,
        chunk_index=i,
      )

    from resumes.services import UpdateTextResumeService

    UpdateTextResumeService(
      user=user,
      resume=resume,
      title=new_title,
    ).perform()

    resume.refresh_from_db()
    self.assertEqual(resume.title, new_title)
    self.assertEqual(ResumeEmbedding.objects.filter(resume=resume).count(), n_embeddings)
    self.assertEqual(resume.analysis_status, original_status)
    self.assertEqual(resume.analysis_step, original_step)
    mock_send_task.assert_not_called()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property6SoftDeleteTests(TestCase):
  """Property 6: Soft delete 동작."""

  @given(title=safe_text)
  @settings(max_examples=100, deadline=None)
  def test_soft_delete_behavior(self, title):
    """Feature: resume-crud-api, Property 6: Soft delete 동작

        DELETE 후 deleted_at != None, Resume.objects 제외, Resume.all_objects 포함.

        **Validates: Requirements 4.1, 4.2, 4.3, 8.1, 8.2, 8.3**
        """
    user = _verified_user()
    client = _make_auth_client(user)

    resume = TextResumeFactory(user=user, title=title)
    ResumeTextContent.objects.create(user=user, resume=resume, content="content")
    resume_pk = resume.pk

    url = reverse("resume-detail", kwargs={"uuid": resume_pk})
    response = client.delete(url)
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # deleted_at에 타임스탬프가 기록됨
    deleted_resume = Resume.all_objects.get(pk=resume_pk)
    self.assertIsNotNone(deleted_resume.deleted_at)

    # 기본 매니저(objects)에서 제외됨
    self.assertFalse(Resume.objects.filter(pk=resume_pk).exists())

    # all_objects 매니저에서는 조회 가능
    self.assertTrue(Resume.all_objects.filter(pk=resume_pk).exists())


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property7UnifiedCreateTypeTests(TestCase):
  """Property 7: 통합 생성 타입 분기."""

  @given(
    resume_type=st.sampled_from(["text", "file"]),
    title=safe_text,
    content=safe_text,
  )
  @settings(max_examples=100, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  @patch(
    "resumes.services.mixins.file_resume_pipeline_mixin.default_storage.save",
    return_value="resumes/test/path.pdf",
  )
  def test_unified_create_type_dispatch(self, mock_storage_save, mock_send_task, resume_type, title, content):
    """Feature: resume-crud-api, Property 7: 통합 생성 타입 분기

        POST /api/v1/resumes/ 요청 시 type 값에 따라 올바른 타입의 이력서가 생성된다.

        **Validates: Requirements 5.1, 5.2, 5.3, 9.7**
        """
    user = _verified_user()
    client = _make_auth_client(user)

    url = reverse("resume-list")

    if resume_type == "text":
      data = {"type": "text", "title": title, "content": content}
      response = client.post(url, data, format="json")
    else:
      fake_file = SimpleUploadedFile("test.pdf", b"%PDF-1.4 fake content", content_type="application/pdf")
      data = {"type": "file", "title": title, "file": fake_file}
      response = client.post(url, data, format="multipart")

    self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
    self.assertEqual(response.data["type"], resume_type)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property8ProxyModelFilteringTests(TestCase):
  """Property 8: 프록시 모델 타입 필터링."""

  @given(
    n_text=st.integers(min_value=0, max_value=3),
    n_file=st.integers(min_value=0, max_value=3),
  )
  @settings(max_examples=100, deadline=None)
  def test_proxy_model_filtering(self, n_text, n_file):
    """Feature: resume-crud-api, Property 8: 프록시 모델 타입 필터링

        TextResume.objects는 type='text'만, FileResume.objects는 type='file'만 반환한다.

        **Validates: Requirement 9.2**
        """
    user = _verified_user()

    text_resumes = []
    for _ in range(n_text):
      text_resumes.append(TextResumeFactory(user=user))

    file_resumes = []
    for _ in range(n_file):
      file_resumes.append(FileResumeFactory(user=user))

    text_qs = TextResume.objects.filter(user=user)
    file_qs = FileResume.objects.filter(user=user)

    self.assertEqual(text_qs.count(), n_text)
    self.assertEqual(file_qs.count(), n_file)

    # TextResume.objects에는 file 타입이 없어야 함
    for r in text_qs:
      self.assertEqual(r.type, ResumeType.TEXT)

    # FileResume.objects에는 text 타입이 없어야 함
    for r in file_qs:
      self.assertEqual(r.type, ResumeType.FILE)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property9FileResumeContentUpdateTests(TestCase):
  """Property 9: 파일 이력서 수정 시 ResumeFileContent 업데이트."""

  @given(
    new_filename=st.text(
      min_size=1,
      max_size=50,
      alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd")),
    ),
    file_size=st.integers(min_value=1, max_value=10_000_000),
  )
  @settings(max_examples=100, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  @patch(
    "resumes.services.mixins.file_resume_pipeline_mixin.default_storage.save",
    return_value="resumes/test/path.pdf",
  )
  def test_file_resume_content_update(self, mock_storage_save, mock_send_task, new_filename, file_size):
    """Feature: resume-crud-api, Property 9: 파일 이력서 수정 시 ResumeFileContent 업데이트

        새 파일 업로드 시 original_filename, storage_path, file_size_bytes가 갱신된다.

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
    fake_file = SimpleUploadedFile(
      filename_with_ext,
      b"x" * file_size,
      content_type="application/pdf",
    )

    UpdateFileResumeService(
      user=user,
      resume=resume,
      file=fake_file,
    ).perform()

    resume.refresh_from_db()
    file_content = ResumeFileContent.objects.get(resume=resume)

    self.assertEqual(file_content.original_filename, filename_with_ext)
    self.assertEqual(file_content.storage_path, "resumes/test/path.pdf")
    self.assertEqual(file_content.file_size_bytes, file_size)
