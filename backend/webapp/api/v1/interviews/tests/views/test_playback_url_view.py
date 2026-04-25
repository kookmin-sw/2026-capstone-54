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
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.COMPLETED,
    )
    SubscriptionFactory.create(user=self.user, pro=True)

    mock_service_class.return_value.perform.return_value = {
      "url": "http://example.com/video",
      "scaledUrl": None,
      "audioUrl": None,
      "mediaType": "video",
      "expiresIn": 3600,
    }

    url = f"{BASE}/recordings/{recording.pk}/playback-url/"
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_playback_url_free_plan_returns_403(self):
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.COMPLETED,
    )

    url = f"{BASE}/recordings/{recording.pk}/playback-url/"
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
