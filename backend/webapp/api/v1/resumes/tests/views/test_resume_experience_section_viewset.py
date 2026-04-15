"""ResumeExperienceSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeExperienceFactory, ResumeFactory
from resumes.models import ResumeExperience
from users.factories import UserFactory


class ResumeExperienceSectionViewSetTests(TestCase):
  """경력 섹션 CRUD (GET list / POST / PUT item / DELETE item)."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.list_url = reverse(
      "resume-sections:resume-section-experiences",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def _item_url(self, uuid):
    return reverse(
      "resume-sections:resume-section-experience-item",
      kwargs={
        "resume_uuid": self.resume.pk,
        "uuid": uuid
      },
    )

  def test_get_list_returns_existing_items(self):
    ResumeExperienceFactory(resume=self.resume, company="ACME", display_order=0)
    ResumeExperienceFactory(resume=self.resume, company="Beta", display_order=1)
    response = self.client.get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 2)

  def test_get_list_empty_returns_empty_array(self):
    response = self.client.get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data, [])

  def test_post_creates_experience(self):
    response = self.client.post(
      self.list_url,
      data={
        "company": "ACME",
        "role": "Backend",
        "period": "2022-2024",
        "responsibilities": ["API 설계"],
        "highlights": ["QPS 3배"],
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(ResumeExperience.objects.filter(resume=self.resume, company="ACME").exists())
    self.resume.refresh_from_db()
    self.assertTrue(self.resume.is_dirty)

  def test_put_updates_existing_item(self):
    exp = ResumeExperienceFactory(resume=self.resume, company="Old")
    response = self.client.put(self._item_url(exp.pk), data={"company": "New"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    exp.refresh_from_db()
    self.assertEqual(exp.company, "New")

  def test_put_unknown_uuid_returns_404(self):
    response = self.client.put(
      self._item_url("00000000-0000-0000-0000-000000000000"),
      data={"company": "x"},
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_delete_removes_item(self):
    exp = ResumeExperienceFactory(resume=self.resume)
    response = self.client.delete(self._item_url(exp.pk))
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertFalse(ResumeExperience.objects.filter(pk=exp.pk).exists())

  def test_delete_unknown_uuid_returns_404(self):
    response = self.client.delete(self._item_url("00000000-0000-0000-0000-000000000000"))
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_other_users_resume_list_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-experiences",
      kwargs={"resume_uuid": other.pk},
    )
    self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
