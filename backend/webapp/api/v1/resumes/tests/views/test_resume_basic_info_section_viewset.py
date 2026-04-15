"""ResumeBasicInfoSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory
from resumes.models import ResumeBasicInfo
from users.factories import UserFactory


class ResumeBasicInfoSectionViewSetTests(TestCase):
  """PUT /sections/basic-info/ — 1:1 upsert."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.url = reverse(
      "resume-sections:resume-section-basic-info",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def test_put_creates_row_and_marks_dirty(self):
    """최초 PUT 은 row 를 생성하고 Resume.is_dirty=True 로 바꾼다."""
    response = self.client.put(
      self.url,
      data={
        "name": "홍길동",
        "email": "hong@example.com",
        "phone": "010-0000-0000",
        "location": "서울"
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["name"], "홍길동")
    row = ResumeBasicInfo.objects.get(resume=self.resume)
    self.assertEqual(row.email, "hong@example.com")
    self.resume.refresh_from_db()
    self.assertTrue(self.resume.is_dirty)

  def test_put_second_time_updates_existing_row(self):
    """두 번째 PUT 은 기존 row 를 갱신하고 중복 생성하지 않는다 (1:1)."""
    self.client.put(self.url, data={"name": "A"}, format="json")
    self.client.put(self.url, data={"name": "B"}, format="json")
    self.assertEqual(ResumeBasicInfo.objects.filter(resume=self.resume).count(), 1)
    self.assertEqual(ResumeBasicInfo.objects.get(resume=self.resume).name, "B")

  def test_put_empty_body_is_accepted(self):
    """빈 body 도 허용되며 모든 필드가 빈 문자열로 저장된다."""
    response = self.client.put(self.url, data={}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_put_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-basic-info",
      kwargs={"resume_uuid": other.pk},
    )
    response = self.client.put(url, data={"name": "x"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().put(self.url, data={"name": "x"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_email_unverified_user_returns_403(self):
    unverified = UserFactory()
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(unverified).access_token)}")
    response = client.put(self.url, data={"name": "x"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
