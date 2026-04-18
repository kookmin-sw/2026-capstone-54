from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
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


class RecordingViewTests(TestCase):
  """면접 녹화 뷰 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    self.other_user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  @patch("api.v1.interviews.views.recording_views.InitiateRecordingService")
  def test_initiate_recording_endpoint_returns_201(self, mock_service_class):
    """정상적인 녹화 시작 요청 시 201 상태 코드를 반환한다."""
    mock_service_instance = mock_service_class.return_value
    mock_service_instance.perform.return_value = {
      "recordingId": "test-id",
      "uploadId": "upload-id",
      "s3Key": "key",
      "presignedUrls": [{
        "partNumber": 1,
        "url": "url"
      }],
    }

    url = reverse("v1:interviews:initiate-recording", kwargs={"uuid": self.session.uuid})
    data = {
      "turn_id": self.turn.pk,
      "media_type": "video",
    }

    response = self.client.post(url, data)
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(response.data["recordingId"], "test-id")

  def test_initiate_recording_endpoint_requires_auth(self):
    """인증되지 않은 사용자의 녹화 시작 요청 시 401 상태 코드를 반환한다."""
    unauth_client = APIClient()
    url = reverse("v1:interviews:initiate-recording", kwargs={"uuid": self.session.uuid})
    data = {
      "turn_id": self.turn.pk,
      "media_type": "video",
    }

    response = unauth_client.post(url, data)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_list_recordings_returns_user_recordings(self):
    """녹화 목록 조회 시 본인의 녹화만 반환한다."""
    InterviewRecordingFactory(interview_session=self.session, user=self.user)
    InterviewRecordingFactory(interview_session=self.session, user=self.user)

    other_session = InterviewSessionFactory(user=self.other_user)
    InterviewRecordingFactory(interview_session=other_session, user=self.other_user)

    url = reverse("v1:interviews:recording-list", kwargs={"uuid": self.session.uuid})
    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 2)

  @patch("api.v1.interviews.views.recording_views.GeneratePlaybackUrlService")
  def test_playback_url_returns_presigned_url(self, mock_service_class):
    """정상적인 재생 URL 요청 시 URL을 반환한다."""
    recording = InterviewRecordingFactory(interview_session=self.session, user=self.user)

    mock_service_instance = mock_service_class.return_value
    mock_service_instance.perform.return_value = {
      "url": "http://example.com/video",
      "scaledUrl": None,
      "audioUrl": None,
      "mediaType": "video",
      "expiresIn": 3600,
    }

    url = reverse("v1:interviews:playback-url", kwargs={"uuid": recording.pk})
    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["url"], "http://example.com/video")

  @patch("api.v1.interviews.views.recording_views.CompleteRecordingService")
  def test_complete_recording_endpoint_returns_200(self, mock_service_class):
    """정상적인 녹화 완료 요청 시 200 상태 코드를 반환한다."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    url = reverse("v1:interviews:complete-recording", kwargs={"uuid": recording.pk})
    data = {
      "parts": [{
        "PartNumber": 1,
        "ETag": "etag"
      }],
      "end_timestamp": "2023-01-01T00:00:00Z",
      "duration_ms": 1000,
    }

    response = self.client.post(url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["recordingId"], str(recording.pk))
    mock_service_class.assert_called_once()

  @patch("api.v1.interviews.views.recording_views.AbortRecordingService")
  def test_abort_recording_endpoint_returns_204(self, mock_service_class):
    """정상적인 녹화 중단 요청 시 204 상태 코드를 반환한다."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    url = reverse("v1:interviews:abort-recording", kwargs={"uuid": recording.pk})

    response = self.client.post(url)

    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    mock_service_class.assert_called_once()
