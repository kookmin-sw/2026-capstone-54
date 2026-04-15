"""ResumeCertificationSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeCertificationFactory, ResumeFactory
from resumes.models import ResumeCertification
from users.factories import UserFactory


class ResumeCertificationSectionViewSetTests(TestCase):
  """자격증 섹션 CRUD."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.list_url = reverse(
      "resume-sections:resume-section-certifications",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def _item_url(self, uuid):
    return reverse(
      "resume-sections:resume-section-certification-item",
      kwargs={
        "resume_uuid": self.resume.pk,
        "uuid": uuid
      },
    )

  def test_get_list(self):
    ResumeCertificationFactory(resume=self.resume, name="AWS SAA")
    response = self.client.get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 1)

  def test_post_creates_certification(self):
    response = self.client.post(
      self.list_url,
      data={
        "name": "AWS SAA",
        "issuer": "AWS",
        "date": "2023-05"
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(ResumeCertification.objects.filter(name="AWS SAA").exists())

  def test_put_updates_item(self):
    cert = ResumeCertificationFactory(resume=self.resume, name="Old")
    response = self.client.put(self._item_url(cert.pk), data={"name": "New"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_delete_item(self):
    cert = ResumeCertificationFactory(resume=self.resume)
    response = self.client.delete(self._item_url(cert.pk))
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

  def test_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-certifications",
      kwargs={"resume_uuid": other.pk},
    )
    self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
