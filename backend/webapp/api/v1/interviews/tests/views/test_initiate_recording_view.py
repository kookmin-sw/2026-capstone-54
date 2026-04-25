from unittest.mock import patch

from django.test import TestCase
from interviews.enums import InterviewSessionStatus
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
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
    mock_service_class.return_value.perform.return_value = {
      "recordingId": "test-id",
      "uploadId": "upload-id",
      "s3Key": "key",
    }

    url = f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/"
    response = self.client.post(url, {"turn_id": self.turn.pk, "media_type": "video"})
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

  def test_initiate_recording_endpoint_requires_auth(self):
    unauth_client = APIClient()
    url = f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/"
    response = unauth_client.post(url, {"turn_id": self.turn.pk, "media_type": "video"})
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
