"""ResumeTextContentTemplateListView 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from profiles.factories.job_factory import JobFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeTextContentTemplateFactory
from users.factories import UserFactory


class ResumeTextContentTemplateListViewTests(TestCase):
  """GET /templates/ — 템플릿 목록 + 필터."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.frontend_job = JobFactory(name="프론트엔드 개발자")
    self.backend_job = JobFactory(name="백엔드 개발자")
    self.frontend_template = ResumeTextContentTemplateFactory(
      job=self.frontend_job, title="프론트엔드 기본", content="## 프론트엔드 템플릿 본문"
    )
    self.backend_template = ResumeTextContentTemplateFactory(
      job=self.backend_job, title="백엔드 기본", content="## 백엔드 템플릿 본문"
    )
    self.url = reverse("resume-templates-list")

  def test_list_returns_all_templates(self):
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 2)

  def test_list_filters_by_job_id(self):
    response = self.client.get(self.url + f"?job={self.frontend_job.pk}")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 1)
    self.assertEqual(response.data[0]["job"]["name"], "프론트엔드 개발자")

  def test_list_returns_minimal_fields_only(self):
    response = self.client.get(self.url)
    item = response.data[0]
    self.assertIn("uuid", item)
    self.assertIn("title", item)
    self.assertIn("job", item)
    self.assertNotIn("content", item)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
