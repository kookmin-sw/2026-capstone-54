"""ResumeEducationSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeEducationFactory, ResumeFactory
from resumes.models import ResumeEducation
from users.factories import UserFactory


class ResumeEducationSectionViewSetTests(TestCase):
  """학력 섹션 CRUD."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.list_url = reverse(
      "resume-sections:resume-section-educations",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def _item_url(self, uuid):
    return reverse(
      "resume-sections:resume-section-education-item",
      kwargs={
        "resume_uuid": self.resume.pk,
        "uuid": uuid
      },
    )

  def test_get_list(self):
    ResumeEducationFactory(resume=self.resume, school="KMU")
    response = self.client.get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 1)

  def test_post_creates_education(self):
    response = self.client.post(
      self.list_url,
      data={
        "school": "KMU",
        "degree": "학사",
        "major": "CS",
        "period": "2016-2020"
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(ResumeEducation.objects.filter(school="KMU").exists())

  def test_put_updates_item(self):
    edu = ResumeEducationFactory(resume=self.resume, school="Old")
    response = self.client.put(self._item_url(edu.pk), data={"school": "New"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    edu.refresh_from_db()
    self.assertEqual(edu.school, "New")

  def test_delete_item(self):
    edu = ResumeEducationFactory(resume=self.resume)
    response = self.client.delete(self._item_url(edu.pk))
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

  def test_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-educations",
      kwargs={"resume_uuid": other.pk},
    )
    self.assertEqual(self.client.post(url, data={"school": "x"}, format="json").status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
