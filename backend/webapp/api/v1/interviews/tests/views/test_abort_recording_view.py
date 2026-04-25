from unittest.mock import patch

from django.test import TestCase
from interviews.enums import InterviewSessionStatus, RecordingStatus
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


class AbortRecordingViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  @patch("api.v1.interviews.views.abort_recording_view.AbortRecordingService")
  def test_abort_recording_endpoint_returns_204(self, mock_service_class):
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    url = f"{BASE}/recordings/{recording.pk}/abort/"
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
