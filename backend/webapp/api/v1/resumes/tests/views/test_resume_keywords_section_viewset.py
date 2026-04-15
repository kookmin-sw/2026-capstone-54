"""ResumeKeywordsSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory
from resumes.models import Keyword, ResumeKeyword
from users.factories import UserFactory


class ResumeKeywordsSectionViewSetTests(TestCase):
  """PUT /sections/keywords/ — canonical 키워드 전체 교체."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.url = reverse(
      "resume-sections:resume-section-keywords",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def test_put_creates_junction_and_canonical_rows(self):
    response = self.client.put(self.url, data={"keywords": ["microservices", "pgvector"]}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(ResumeKeyword.objects.filter(resume=self.resume).count(), 2)
    self.assertTrue(Keyword.objects.filter(text="microservices").exists())

  def test_put_second_time_replaces(self):
    self.client.put(self.url, data={"keywords": ["a"]}, format="json")
    self.client.put(self.url, data={"keywords": ["b"]}, format="json")
    texts = list(ResumeKeyword.objects.filter(resume=self.resume).values_list("keyword__text", flat=True))
    self.assertEqual(texts, ["b"])

  def test_put_empty_list_clears_all(self):
    self.client.put(self.url, data={"keywords": ["a"]}, format="json")
    self.client.put(self.url, data={"keywords": []}, format="json")
    self.assertEqual(ResumeKeyword.objects.filter(resume=self.resume).count(), 0)

  def test_put_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-keywords",
      kwargs={"resume_uuid": other.pk},
    )
    response = self.client.put(url, data={"keywords": ["x"]}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().put(self.url, data={"keywords": []}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
