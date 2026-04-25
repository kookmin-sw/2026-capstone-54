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
    self.other_user = UserFactory(is_email_confirmed=True)
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  def test_list_recordings_returns_user_recordings(self):
    InterviewRecordingFactory(interview_session=self.session, user=self.user)
    InterviewRecordingFactory(interview_session=self.session, user=self.user)

    other_session = InterviewSessionFactory(user=self.other_user)
    InterviewRecordingFactory(interview_session=other_session, user=self.other_user)

    url = f"{BASE}/interview-sessions/{self.session.uuid}/recordings/"
    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 2)
