"""ResumeSummarySectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory
from resumes.models import ResumeSummary
from users.factories import UserFactory


class ResumeSummarySectionViewSetTests(TestCase):
  """PUT /sections/summary/ — 1:1 upsert."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.url = reverse(
      "resume-sections:resume-section-summary",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def test_put_creates_row_and_marks_dirty(self):
    response = self.client.put(self.url, data={"text": "백엔드 개발자입니다."}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(ResumeSummary.objects.get(resume=self.resume).text, "백엔드 개발자입니다.")
    self.resume.refresh_from_db()
    self.assertTrue(self.resume.is_dirty)

  def test_put_second_time_updates_existing_row(self):
    self.client.put(self.url, data={"text": "v1"}, format="json")
    self.client.put(self.url, data={"text": "v2"}, format="json")
    self.assertEqual(ResumeSummary.objects.filter(resume=self.resume).count(), 1)
    self.assertEqual(ResumeSummary.objects.get(resume=self.resume).text, "v2")

  def test_put_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-summary",
      kwargs={"resume_uuid": other.pk},
    )
    response = self.client.put(url, data={"text": "x"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().put(self.url, data={"text": "x"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
