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
from subscriptions.factories import SubscriptionFactory
from users.factories import UserFactory

BASE = "/api/v1/interviews"


class PlaybackUrlViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  @patch("api.v1.interviews.views.playback_url_view.GeneratePlaybackUrlService")
  def test_playback_url_returns_presigned_url(self, mock_service_class):
    mock_service = MagicMock()
    mock_service.perform.return_value = {
      "url": "https://playback.example.com",
      "scaledUrl": None,
      "audioUrl": None,
      "mediaType": "video",
      "expiresIn": 3600,
    }
    mock_service_class.return_value = mock_service

    SubscriptionFactory(user=self.user, pro=True)

    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.COMPLETED
    )

    response = self.client.get(f"{BASE}/recordings/{recording.uuid}/playback-url/")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["url"], "https://playback.example.com")

  def test_playback_url_free_plan_returns_403(self):
    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.COMPLETED
    )

    response = self.client.get(f"{BASE}/recordings/{recording.uuid}/playback-url/")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
