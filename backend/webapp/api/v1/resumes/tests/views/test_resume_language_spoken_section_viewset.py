"""ResumeLanguageSpokenSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory, ResumeLanguageSpokenFactory
from resumes.models import ResumeLanguageSpoken
from users.factories import UserFactory


class ResumeLanguageSpokenSectionViewSetTests(TestCase):
  """구사 언어 섹션 CRUD."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.list_url = reverse(
      "resume-sections:resume-section-languages-spoken",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def _item_url(self, uuid):
    return reverse(
      "resume-sections:resume-section-language-spoken-item",
      kwargs={
        "resume_uuid": self.resume.pk,
        "uuid": uuid
      },
    )

  def test_get_list(self):
    ResumeLanguageSpokenFactory(resume=self.resume, language="English", level="Business")
    response = self.client.get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 1)

  def test_post_creates_language(self):
    response = self.client.post(
      self.list_url,
      data={
        "language": "영어",
        "level": "비즈니스"
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(ResumeLanguageSpoken.objects.filter(language="영어").exists())

  def test_put_updates_item(self):
    item = ResumeLanguageSpokenFactory(resume=self.resume, level="Basic")
    response = self.client.put(self._item_url(item.pk), data={"level": "Native"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    item.refresh_from_db()
    self.assertEqual(item.level, "Native")

  def test_delete_item(self):
    item = ResumeLanguageSpokenFactory(resume=self.resume)
    response = self.client.delete(self._item_url(item.pk))
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

  def test_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-languages-spoken",
      kwargs={"resume_uuid": other.pk},
    )
    self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
