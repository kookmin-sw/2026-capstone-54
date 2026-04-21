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


class RecordingViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    self.other_user = UserFactory(is_email_confirmed=True)
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  @patch("api.v1.interviews.views.recording_views.InitiateRecordingService")
  def test_initiate_recording_endpoint_returns_201(self, mock_service_class):
    mock_service_instance = mock_service_class.return_value
    mock_service_instance.perform.return_value = {
      "recordingId": "test-id",
      "uploadId": "upload-id",
      "s3Key": "key",
      "presignedUrls": [{
        "partNumber": 1,
        "url": "url"
      }],
      "singleUploadUrl": "url",
    }

    url = f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/"
    response = self.client.post(url, {"turn_id": self.turn.pk, "media_type": "video"})
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

  def test_initiate_recording_endpoint_requires_auth(self):
    unauth_client = APIClient()
    url = f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/"
    response = unauth_client.post(url, {"turn_id": self.turn.pk, "media_type": "video"})
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_list_recordings_returns_user_recordings(self):
    InterviewRecordingFactory(interview_session=self.session, user=self.user)
    InterviewRecordingFactory(interview_session=self.session, user=self.user)

    other_session = InterviewSessionFactory(user=self.other_user)
    InterviewRecordingFactory(interview_session=other_session, user=self.other_user)

    url = f"{BASE}/interview-sessions/{self.session.uuid}/recordings/"
    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 2)

  @patch("api.v1.interviews.views.recording_views.GeneratePlaybackUrlService")
  def test_playback_url_returns_presigned_url(self, mock_service_class):
    recording = InterviewRecordingFactory(interview_session=self.session, user=self.user)
    SubscriptionFactory.create(user=self.user, pro=True)

    mock_service_instance = mock_service_class.return_value
    mock_service_instance.perform.return_value = {
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
    recording = InterviewRecordingFactory(interview_session=self.session, user=self.user)
    url = f"{BASE}/recordings/{recording.pk}/playback-url/"

    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  @patch("api.v1.interviews.views.recording_views.CompleteRecordingService")
  def test_complete_recording_endpoint_returns_200(self, mock_service_class):
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    url = f"{BASE}/recordings/{recording.pk}/complete/"
    data = {
      "parts": [{
        "part_number": 1,
        "etag": "etag"
      }],
      "end_timestamp": "2023-01-01T00:00:00Z",
      "duration_ms": 1000,
    }

    response = self.client.post(url, data, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  @patch("api.v1.interviews.views.recording_views.AbortRecordingService")
  def test_abort_recording_endpoint_returns_204(self, mock_service_class):
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    url = f"{BASE}/recordings/{recording.pk}/abort/"
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
