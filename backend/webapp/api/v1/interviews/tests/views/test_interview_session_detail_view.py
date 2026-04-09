import uuid

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class InterviewSessionDetailViewTests(TestCase):
  """InterviewSessionDetailView GET 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.url = reverse("interview-session-detail", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_200_with_session_data(self):
    """정상 요청 시 200과 세션 데이터를 반환한다."""
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_response_contains_uuid_field(self):
    """응답에 uuid 필드가 포함된다."""
    response = self.client.get(self.url)
    self.assertIn("uuid", response.data)
    self.assertEqual(str(response.data["uuid"]), str(self.session.pk))

  def test_response_contains_session_type(self):
    """응답에 interview_session_type 필드가 포함된다."""
    response = self.client.get(self.url)
    self.assertIn("interview_session_type", response.data)
    self.assertEqual(response.data["interview_session_type"], InterviewSessionType.FOLLOWUP)

  def test_response_contains_session_status(self):
    """응답에 interview_session_status 필드가 포함된다."""
    response = self.client.get(self.url)
    self.assertIn("interview_session_status", response.data)

  def test_other_user_session_returns_404(self):
    """다른 사용자의 세션이면 404를 반환한다."""
    other_session = InterviewSessionFactory()
    url = reverse("interview-session-detail", kwargs={"interview_session_uuid": str(other_session.pk)})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_nonexistent_session_returns_404(self):
    """존재하지 않는 세션 UUID이면 404를 반환한다."""
    url = reverse("interview-session-detail", kwargs={"interview_session_uuid": str(uuid.uuid4())})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_unverified_email_returns_403(self):
    """이메일 미인증 사용자는 403을 반환한다."""
    unverified = UserFactory(email_confirmed_at=None)
    token = RefreshToken.for_user(unverified)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    session = InterviewSessionFactory(user=unverified)
    url = reverse("interview-session-detail", kwargs={"interview_session_uuid": str(session.pk)})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_completed_session_returns_200(self):
    """완료된 세션도 조회 가능하다."""
    completed_session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    url = reverse("interview-session-detail", kwargs={"interview_session_uuid": str(completed_session.pk)})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
