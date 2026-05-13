"""ResumeJobCategorySectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory
from resumes.models import ResumeJobCategory
from users.factories import UserFactory


class ResumeJobCategorySectionViewSetTests(TestCase):
  """PUT /sections/job-category/ — FK lookup-or-create."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user)
    self.url = reverse(
      "resume-sections:resume-section-job-category",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def test_put_creates_category_and_links_fk(self):
    response = self.client.put(self.url, data={"name": "IT/개발"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIsNotNone(response.data["category"])
    self.assertEqual(response.data["category"]["name"], "IT/개발")
    self.resume.refresh_from_db()
    self.assertIsNotNone(self.resume.resume_job_category_id)

  def test_put_same_name_twice_reuses_existing_category(self):
    self.client.put(self.url, data={"name": "마케팅"}, format="json")
    self.client.put(self.url, data={"name": "마케팅"}, format="json")
    self.assertEqual(ResumeJobCategory.objects.filter(name="마케팅").count(), 1)

  def test_put_empty_name_returns_null_category(self):
    response = self.client.put(self.url, data={"name": ""}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIsNone(response.data["category"])

  def test_put_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-job-category",
      kwargs={"resume_uuid": other.pk},
    )
    response = self.client.put(url, data={"name": "IT/개발"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().put(self.url, data={"name": "IT/개발"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
