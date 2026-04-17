from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.enums import AnalysisStatus
from resumes.factories import TextResumeFactory
from resumes.models import Resume, ResumeTextContent
from users.factories import UserFactory


class ResumeViewSetTests(TestCase):
  """ResumeViewSet 단위 테스트."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

    self.resume = TextResumeFactory(user=self.user, title="테스트 이력서")
    self.resume.analysis_status = AnalysisStatus.COMPLETED
    self.resume.save(update_fields=["analysis_status"])
    self.text_content = ResumeTextContent.objects.create(
      user=self.user,
      resume=self.resume,
      content="테스트 내용",
    )
    self.list_url = reverse("resume-list")
    self.detail_url = reverse("resume-detail", kwargs={"uuid": self.resume.pk})

  # ── list ──

  def test_목록_조회(self):
    """GET /api/v1/resumes/ → 200, 내 이력서 목록 반환."""
    response = self.client.get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["count"], 1)
    self.assertEqual(len(response.data["results"]), 1)
    self.assertEqual(response.data["results"][0]["uuid"], str(self.resume.pk))

  # ── create ──

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_텍스트_이력서_생성(self, mock_send_task):
    """POST type=text → 202."""
    data = {"type": "text", "title": "새 이력서", "content": "내용"}
    response = self.client.post(self.list_url, data, format="json")
    self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
    self.assertEqual(response.data["type"], "text")

  @patch("resumes.services.mixins.file_resume_pipeline_mixin.default_storage")
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_파일_이력서_생성(self, mock_send_task, mock_storage):
    """POST type=file → 202."""
    mock_storage.save.return_value = "resumes/test/path.pdf"
    pdf = SimpleUploadedFile("resume.pdf", b"%PDF-1.4 test", content_type="application/pdf")
    data = {"type": "file", "title": "파일 이력서", "file": pdf}
    response = self.client.post(self.list_url, data, format="multipart")
    self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
    self.assertEqual(response.data["type"], "file")

  def test_잘못된_타입_생성_시_400(self):
    """POST type=invalid → 400."""
    data = {"type": "invalid", "title": "이력서", "content": "내용"}
    response = self.client.post(self.list_url, data, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  # ── retrieve ──

  def test_상세_조회(self):
    """GET /api/v1/resumes/{uuid}/ → 200, 상세 필드 포함."""
    response = self.client.get(self.detail_url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["uuid"], str(self.resume.pk))
    self.assertEqual(response.data["title"], "테스트 이력서")
    self.assertEqual(response.data["content"], "테스트 내용")

  def test_타인_이력서_조회_시_404(self):
    """다른 사용자의 이력서 → 404."""
    other = UserFactory(email_confirmed_at=timezone.now())
    other_resume = TextResumeFactory(user=other)
    url = reverse("resume-detail", kwargs={"uuid": other_resume.pk})
    self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

  def test_soft_delete된_이력서_조회_시_404(self):
    """soft delete된 이력서 → 404."""
    self.resume.delete()
    self.assertEqual(self.client.get(self.detail_url).status_code, status.HTTP_404_NOT_FOUND)

  # ── update / partial_update ──

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_PUT_전체_수정(self, mock_send_task):
    """PUT → 200, 제목+내용 수정."""
    response = self.client.put(self.detail_url, {"title": "수정", "content": "수정 내용"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["title"], "수정")
    self.assertEqual(response.data["content"], "수정 내용")

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_PATCH_부분_수정(self, mock_send_task):
    """PATCH → 200, 제목만 수정, 내용 유지."""
    response = self.client.patch(self.detail_url, {"title": "부분 수정"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["title"], "부분 수정")
    self.assertEqual(response.data["content"], "테스트 내용")

  # ── destroy ──

  def test_DELETE_soft_delete(self):
    """DELETE → 204, soft delete 확인."""
    response = self.client.delete(self.detail_url)
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertFalse(Resume.objects.filter(pk=self.resume.pk).exists())
    deleted = Resume.all_objects.get(pk=self.resume.pk)
    self.assertIsNotNone(deleted.deleted_at)

  # ── permission ──

  def test_이메일_미인증_사용자_403(self):
    """이메일 미인증 → 403."""
    unverified = UserFactory()
    token = RefreshToken.for_user(unverified)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    self.assertEqual(client.get(self.list_url).status_code, status.HTTP_403_FORBIDDEN)
