from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from tickets.factories import UserTicketFactory
from users.factories import UserFactory


class StartInterviewViewTests(TestCase):
  """StartInterviewView POST 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=0,
    )
    self.url = reverse("interview-start", kwargs={"interview_session_uuid": str(self.session.pk)})
    UserTicketFactory(user=self.user, daily_count=10, purchased_count=0)

  def _mock_turns(self, count=3):
    turns = [InterviewTurnFactory.build(interview_session=self.session, turn_number=i + 1) for i in range(count)]
    return turns

  @patch("api.v1.interviews.views.start_interview_view.GenerateInitialQuestionsService")
  def test_returns_201_with_turn_list(self, MockService):
    """정상 요청 시 201과 턴 목록을 반환한다."""
    turns = InterviewTurnFactory.create_batch(3, interview_session=self.session)
    MockService.return_value.perform.return_value = turns

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(len(response.data), 3)

  @patch("api.v1.interviews.views.start_interview_view.GenerateInitialQuestionsService")
  def test_service_called_with_correct_session(self, MockService):
    """올바른 세션으로 서비스가 호출된다."""
    MockService.return_value.perform.return_value = []

    self.client.post(self.url)

    MockService.assert_called_once_with(interview_session=self.session)

  def test_session_belonging_to_other_user_returns_404(self):
    """다른 사용자의 세션 UUID이면 404를 반환한다."""
    other_session = InterviewSessionFactory()
    url = reverse("interview-start", kwargs={"interview_session_uuid": str(other_session.pk)})
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_unverified_email_returns_403(self):
    """이메일 미인증 사용자는 403을 반환한다."""
    unverified = UserFactory(email_confirmed_at=None)
    token = RefreshToken.for_user(unverified)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    session = InterviewSessionFactory(user=unverified)
    url = reverse("interview-start", kwargs={"interview_session_uuid": str(session.pk)})
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_nonexistent_session_uuid_returns_404(self):
    """존재하지 않는 세션 UUID이면 404를 반환한다."""
    import uuid

    url = reverse("interview-start", kwargs={"interview_session_uuid": str(uuid.uuid4())})
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_insufficient_tickets_returns_400(self):
    """티켓이 부족하면 400을 반환한다."""
    self.user.ticket.delete()
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("티켓이 부족합니다", str(response.data))
