from unittest.mock import MagicMock, patch

from django.test import TestCase
from interviews.enums import InterviewSessionStatus
from interviews.factories import (
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory

BASE = "/api/v1/interviews"


class InitiateRecordingViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  @patch("api.v1.interviews.views.initiate_recording_view.InitiateRecordingService")
  def test_initiate_recording_endpoint_returns_201(self, mock_service_class):
    mock_service = MagicMock()
    mock_service.execute.return_value = {"recordingId": "test-id", "uploadId": "upload-id", "s3Key": "key"}
    mock_service_class.return_value = mock_service

    response = self.client.post(f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/")

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.data["recordingId"], "test-id")

  def test_initiate_recording_endpoint_requires_auth(self):
    unauth_client = APIClient()
    response = unauth_client.post(f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
