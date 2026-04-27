from django.test import TestCase
from interviews.enums import InterviewSessionStatus
from interviews.factories import (
  InterviewRecordingFactory,
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory

BASE = "/api/v1/interviews"


class RecordingListViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  def test_list_recordings_returns_user_recordings(self):
    InterviewRecordingFactory(user=self.user, interview_session=self.session, interview_turn=self.turn)
    InterviewRecordingFactory(user=self.user, interview_session=self.session, interview_turn=self.turn)

    other_user = UserFactory()
    other_session = InterviewSessionFactory(user=other_user)
    other_turn = InterviewTurnFactory(interview_session=other_session)
    InterviewRecordingFactory(user=other_user, interview_session=other_session, interview_turn=other_turn)

    response = self.client.get(f"{BASE}/recordings/")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data["results"]), 2)
