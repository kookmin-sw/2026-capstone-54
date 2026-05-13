from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from subscriptions.factories import SubscriptionFactory
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
    """정상 요청 시 201과 turns + owner 정보 + ws_ticket 을 반환한다."""
    turns = InterviewTurnFactory.create_batch(3, interview_session=self.session)
    MockService.return_value.perform.return_value = turns

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(len(response.data["turns"]), 3)
    self.assertIn("owner_token", response.data)
    self.assertIn("owner_version", response.data)
    self.assertIn("ws_ticket", response.data)
    self.assertIn("interview_session", response.data)

  @patch("api.v1.interviews.views.start_interview_view.GenerateInitialQuestionsService")
  def test_response_session_includes_uuid_and_type(self, MockService):
    """응답의 interview_session 은 uuid 와 type 등 핵심 필드를 포함한다."""
    MockService.return_value.perform.return_value = []

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.data["interview_session"]["uuid"], str(self.session.pk))
    self.assertEqual(response.data["interview_session"]["interview_session_type"], InterviewSessionType.FOLLOWUP)

  @patch("api.v1.interviews.views.start_interview_view.GenerateInitialQuestionsService")
  def test_response_session_total_questions_reflects_generated_count(self, MockService):
    """응답의 interview_session.total_questions 는 service 가 채운 turn 수를 반영한다."""

    def perform_side_effect():
      self.session.total_questions = 3
      self.session.save(update_fields=["total_questions"])
      return InterviewTurnFactory.create_batch(3, interview_session=self.session)

    MockService.return_value.perform.side_effect = perform_side_effect

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.data["interview_session"]["total_questions"], 3)

  @patch("api.v1.interviews.views.start_interview_view.GenerateInitialQuestionsService")
  def test_followup_session_estimated_total_is_total_questions_times_four(self, MockService):
    """FOLLOWUP 세션의 estimated_total_questions = total_questions * (1 + MAX_FOLLOWUP_PER_ANCHOR=3)."""

    def perform_side_effect():
      self.session.total_questions = 2
      self.session.save(update_fields=["total_questions"])
      return InterviewTurnFactory.create_batch(2, interview_session=self.session)

    MockService.return_value.perform.side_effect = perform_side_effect

    response = self.client.post(self.url)

    self.assertEqual(response.data["interview_session"]["estimated_total_questions"], 8)

  @patch("api.v1.interviews.views.start_interview_view.GenerateInitialQuestionsService")
  def test_full_process_session_estimated_total_equals_total_questions(self, MockService):
    """FULL_PROCESS 세션의 estimated_total_questions 는 total_questions 와 동일하다."""
    self.session.interview_session_type = InterviewSessionType.FULL_PROCESS
    self.session.save(update_fields=["interview_session_type"])
    SubscriptionFactory.create(user=self.user, pro=True)

    def perform_side_effect():
      self.session.total_questions = 5
      self.session.save(update_fields=["total_questions"])
      return InterviewTurnFactory.create_batch(5, interview_session=self.session)

    MockService.return_value.perform.side_effect = perform_side_effect

    response = self.client.post(self.url)

    self.assertEqual(response.data["interview_session"]["total_questions"], 5)
    self.assertEqual(response.data["interview_session"]["estimated_total_questions"], 5)

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
    """티켓이 부족하면 400 + INSUFFICIENT_TICKETS 코드를 반환한다."""
    self.user.ticket.delete()
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("티켓이 부족합니다", str(response.data))
    self.assertEqual(response.data.get("errorCode") or response.data.get("error_code"), "INSUFFICIENT_TICKETS")

  @patch("api.v1.interviews.views.start_interview_view.GenerateInitialQuestionsService")
  def test_tickets_deducted_when_daily_zero_and_purchased_thirty(self, MockService):
    """daily=0, purchased=30일 때 purchased에서 차감된다."""
    self.user.ticket.delete()
    UserTicketFactory(user=self.user, daily_count=0, purchased_count=30)
    MockService.return_value.perform.return_value = []

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.user.ticket.refresh_from_db()
    self.assertEqual(self.user.ticket.daily_count, 0)
    self.assertEqual(self.user.ticket.purchased_count, 25)
    self.assertEqual(self.user.ticket.total_count, 25)

  def test_already_started_interview_returns_400(self):
    """이미 시작된 면접(total_questions > 0)은 400 + INTERVIEW_ALREADY_STARTED 코드를 반환한다."""
    self.user.ticket.delete()
    UserTicketFactory(user=self.user, daily_count=0, purchased_count=30)
    self.session.total_questions = 5
    self.session.save()

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn("이미 시작된 면접입니다", str(response.data))
    self.assertEqual(response.data.get("errorCode") or response.data.get("error_code"), "INTERVIEW_ALREADY_STARTED")

  def test_real_mode_free_plan_returns_403(self):
    """무료 플랜 사용자의 실전 모드 시작은 403을 반환한다."""
    self.session.interview_practice_mode = "real"
    self.session.save(update_fields=["interview_practice_mode"])

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    self.assertIn("실전 모드는 PRO", str(response.data))

  def test_real_mode_pro_plan_returns_201(self):
    """PRO 플랜 사용자의 실전 모드 시작은 허용된다."""
    self.session.interview_practice_mode = "real"
    self.session.save(update_fields=["interview_practice_mode"])
    SubscriptionFactory.create(user=self.user, pro=True)

    with patch("api.v1.interviews.views.start_interview_view.GenerateInitialQuestionsService") as MockService:
      turns = InterviewTurnFactory.create_batch(2, interview_session=self.session)
      MockService.return_value.perform.return_value = turns

      response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
