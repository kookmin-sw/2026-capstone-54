"""ResumeTextContentTemplateDetailView 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from profiles.factories.job_factory import JobFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeTextContentTemplateFactory
from users.factories import UserFactory


class ResumeTextContentTemplateDetailViewTests(TestCase):
  """GET /templates/{uuid}/ — 전체 content 포함."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.job = JobFactory(name="프론트엔드 개발자")
    self.template = ResumeTextContentTemplateFactory(job=self.job, title="프론트엔드 기본", content="## 프론트엔드 템플릿 본문")

  def test_retrieve_returns_full_content(self):
    url = reverse("resume-templates-detail", kwargs={"uuid": self.template.pk})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["content"], "## 프론트엔드 템플릿 본문")
    self.assertEqual(response.data["job"]["name"], "프론트엔드 개발자")

  def test_retrieve_unknown_uuid_returns_404(self):
    url = reverse("resume-templates-detail", kwargs={"uuid": "00000000-0000-0000-0000-000000000000"})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    url = reverse("resume-templates-detail", kwargs={"uuid": self.template.pk})
    response = APIClient().get(url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
