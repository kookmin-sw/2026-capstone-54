"""ResumeCareerMetaSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory
from resumes.models import ResumeCareerMeta
from users.factories import UserFactory


class ResumeCareerMetaSectionViewSetTests(TestCase):
  """PUT /sections/career-meta/ — 1:1 upsert with years + months."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.url = reverse(
      "resume-sections:resume-section-career-meta",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def test_put_saves_years_and_months(self):
    response = self.client.put(
      self.url,
      data={
        "total_experience_years": 5,
        "total_experience_months": 6
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["total_experience_years"], 5)
    self.assertEqual(response.data["total_experience_months"], 6)
    row = ResumeCareerMeta.objects.get(resume=self.resume)
    self.assertEqual(row.total_experience_years, 5)
    self.assertEqual(row.total_experience_months, 6)

  def test_put_rejects_months_over_11(self):
    response = self.client.put(
      self.url,
      data={
        "total_experience_years": 2,
        "total_experience_months": 12
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_put_rejects_negative_years(self):
    response = self.client.put(self.url, data={"total_experience_years": -1}, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_put_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-career-meta",
      kwargs={"resume_uuid": other.pk},
    )
    response = self.client.put(url, data={"total_experience_years": 1}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().put(self.url, data={"total_experience_years": 1}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
