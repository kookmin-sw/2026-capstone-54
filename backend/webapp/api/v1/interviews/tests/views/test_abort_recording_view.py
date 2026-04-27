from unittest.mock import MagicMock, patch

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
    mock_service = MagicMock()
    mock_service_class.return_value = mock_service

    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.INITIATED
    )

    response = self.client.post(f"{BASE}/recordings/{recording.uuid}/abort/")
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
