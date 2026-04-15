import uuid

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewExchangeType, InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class InterviewTurnListViewTests(TestCase):
  """InterviewTurnListView GET 테스트"""

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
    self.url = reverse("interview-turn-list", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_200_with_turn_list(self):
    """정상 요청 시 200과 턴 목록을 반환한다."""
    InterviewTurnFactory(interview_session=self.session, turn_number=1)
    InterviewTurnFactory(interview_session=self.session, turn_number=2)
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 2)

  def test_returns_empty_list_when_no_turns(self):
    """턴이 없으면 빈 목록을 반환한다."""
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data, [])

  def test_returns_only_turns_for_requested_session(self):
    """요청한 세션의 턴만 반환한다."""
    InterviewTurnFactory(interview_session=self.session, turn_number=1)
    other_session = InterviewSessionFactory(user=self.user)
    InterviewTurnFactory(interview_session=other_session, turn_number=1)

    response = self.client.get(self.url)

    self.assertEqual(len(response.data), 1)

  def test_turns_ordered_by_turn_number(self):
    """턴은 turn_number 순으로 반환된다."""
    turn3 = InterviewTurnFactory(interview_session=self.session, turn_number=3)
    turn1 = InterviewTurnFactory(interview_session=self.session, turn_number=1)
    turn2 = InterviewTurnFactory(interview_session=self.session, turn_number=2)

    response = self.client.get(self.url)

    returned_pks = [t["id"] for t in response.data]
    self.assertEqual(returned_pks, [turn1.pk, turn2.pk, turn3.pk])

  def test_includes_initial_and_followup_turns(self):
    """INITIAL 및 FOLLOWUP 타입 턴이 모두 포함된다."""
    InterviewTurnFactory(interview_session=self.session, turn_type=InterviewExchangeType.INITIAL, turn_number=1)
    InterviewTurnFactory(interview_session=self.session, turn_type=InterviewExchangeType.FOLLOWUP, turn_number=2)

    response = self.client.get(self.url)

    turn_types = [t["turn_type"] for t in response.data]
    self.assertIn(InterviewExchangeType.INITIAL, turn_types)
    self.assertIn(InterviewExchangeType.FOLLOWUP, turn_types)

  def test_other_user_session_returns_404(self):
    """다른 사용자의 세션이면 404를 반환한다."""
    other_session = InterviewSessionFactory()
    url = reverse("interview-turn-list", kwargs={"interview_session_uuid": str(other_session.pk)})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_nonexistent_session_returns_404(self):
    """존재하지 않는 세션 UUID이면 404를 반환한다."""
    url = reverse("interview-turn-list", kwargs={"interview_session_uuid": str(uuid.uuid4())})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
