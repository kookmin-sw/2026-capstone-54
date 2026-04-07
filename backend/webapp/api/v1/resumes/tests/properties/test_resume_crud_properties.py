"""Resume CRUD API 속성 기반 테스트 (Property-Based Tests) — API 레벨.

- API 엔드포인트를 통한 검증
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
from resumes.enums import AnalysisStatus, ResumeType
from resumes.factories import TextResumeFactory
from resumes.models import Resume, ResumeTextContent
from users.factories import UserFactory

safe_text = st.text(
  min_size=1,
  max_size=100,
  alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Lo")),
)


def _make_auth_client(user):
  client = APIClient()
  token = RefreshToken.for_user(user)
  client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
  return client


def _verified_user(**kwargs):
  return UserFactory(email_confirmed_at=timezone.now(), **kwargs)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property1ReadRoundTripTests(TestCase):
  """Property: 이력서 조회 round-trip."""

  @given(title=safe_text)
  @settings(max_examples=5, deadline=None)
  def test_read_round_trip(self, title):
    """Feature: resume-crud-api, Property: 이력서 조회 round-trip

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
  """Property: 소유권 검증 — 타인 이력서 접근 불가."""

  @given(title=safe_text)
  @settings(max_examples=5, deadline=None)
  def test_other_user_cannot_access(self, title):
    """Feature: resume-crud-api, Property: 소유권 검증 — 타인 이력서 접근 불가

    **Validates: Requirements 1.2, 2.5, 3.5, 4.4**
    """
    user_a = _verified_user()
    user_b = _verified_user()
    client_b = _make_auth_client(user_b)
    resume = TextResumeFactory(user=user_a, title=title)
    ResumeTextContent.objects.create(user=user_a, resume=resume, content="content")

    url = reverse("resume-detail", kwargs={"uuid": resume.pk})

    self.assertEqual(client_b.get(url).status_code, status.HTTP_404_NOT_FOUND)
    self.assertEqual(client_b.put(url, {"title": "hack"}, format="json").status_code, status.HTTP_404_NOT_FOUND)
    self.assertEqual(client_b.patch(url, {"title": "hack"}, format="json").status_code, status.HTTP_404_NOT_FOUND)
    self.assertEqual(client_b.delete(url).status_code, status.HTTP_404_NOT_FOUND)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property3TextUpdateRoundTripTests(TestCase):
  """Property: 텍스트 이력서 수정 round-trip."""

  @given(new_title=safe_text, new_content=safe_text)
  @settings(max_examples=5, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_text_update_round_trip(self, mock_send_task, new_title, new_content):
    """Feature: resume-crud-api, Property: 텍스트 이력서 수정 round-trip

    **Validates: Requirements 2.1, 2.4**
    """
    user = _verified_user()
    client = _make_auth_client(user)
    resume = TextResumeFactory(user=user, title="original title")
    ResumeTextContent.objects.create(user=user, resume=resume, content="original content")

    url = reverse("resume-detail", kwargs={"uuid": resume.pk})

    put_resp = client.put(url, {"title": new_title, "content": new_content}, format="json")
    self.assertEqual(put_resp.status_code, status.HTTP_200_OK)

    get_resp = client.get(url)
    self.assertEqual(get_resp.data["title"], new_title)
    self.assertEqual(get_resp.data["content"], new_content)

    patch_title = new_title + "v2"
    patch_resp = client.patch(url, {"title": patch_title}, format="json")
    self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)

    get_resp2 = client.get(url)
    self.assertEqual(get_resp2.data["title"], patch_title)
    self.assertEqual(get_resp2.data["content"], new_content)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property6SoftDeleteTests(TestCase):
  """Property: Soft delete 동작."""

  @given(title=safe_text)
  @settings(max_examples=5, deadline=None)
  def test_soft_delete_behavior(self, title):
    """Feature: resume-crud-api, Property: Soft delete 동작

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

    deleted_resume = Resume.all_objects.get(pk=resume_pk)
    self.assertIsNotNone(deleted_resume.deleted_at)
    self.assertFalse(Resume.objects.filter(pk=resume_pk).exists())
    self.assertTrue(Resume.all_objects.filter(pk=resume_pk).exists())


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class Property7UnifiedCreateTypeTests(TestCase):
  """Property: 통합 생성 타입 분기."""

  @given(
    resume_type=st.sampled_from(["text", "file"]),
    title=safe_text,
    content=safe_text,
  )
  @settings(max_examples=5, deadline=None)
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  @patch(
    "resumes.services.mixins.file_resume_pipeline_mixin.default_storage.save", return_value="resumes/test/path.pdf"
  )
  def test_unified_create_type_dispatch(self, mock_storage_save, mock_send_task, resume_type, title, content):
    """Feature: resume-crud-api, Property: 통합 생성 타입 분기

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
