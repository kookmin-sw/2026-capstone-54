"""ResumeIndustryDomainsSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory
from resumes.models import IndustryDomain, ResumeIndustryDomain
from users.factories import UserFactory


class ResumeIndustryDomainsSectionViewSetTests(TestCase):
  """PUT /sections/industry-domains/ — canonical 참조 전체 교체."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.url = reverse(
      "resume-sections:resume-section-industry-domains",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def test_put_creates_junction_and_canonical_rows(self):
    response = self.client.put(self.url, data={"industry_domains": ["핀테크", "이커머스"]}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(ResumeIndustryDomain.objects.filter(resume=self.resume).count(), 2)
    self.assertTrue(IndustryDomain.objects.filter(name="핀테크").exists())

  def test_put_second_time_replaces(self):
    self.client.put(self.url, data={"industry_domains": ["핀테크"]}, format="json")
    self.client.put(self.url, data={"industry_domains": ["헬스케어"]}, format="json")
    domains = list(
      ResumeIndustryDomain.objects.filter(resume=self.resume).values_list("industry_domain__name", flat=True)
    )
    self.assertEqual(domains, ["헬스케어"])

  def test_put_empty_list_clears_all(self):
    self.client.put(self.url, data={"industry_domains": ["핀테크"]}, format="json")
    self.client.put(self.url, data={"industry_domains": []}, format="json")
    self.assertEqual(ResumeIndustryDomain.objects.filter(resume=self.resume).count(), 0)

  def test_put_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-industry-domains",
      kwargs={"resume_uuid": other.pk},
    )
    response = self.client.put(url, data={"industry_domains": ["x"]}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().put(self.url, data={"industry_domains": []}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
