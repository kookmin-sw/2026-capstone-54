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

  def _mock_service(self, mock_service_class):
    mock_service = MagicMock()
    mock_service.perform.return_value = {
      "url": "https://playback.example.com",
      "scaledUrl": None,
      "audioUrl": None,
      "mediaType": "video",
      "expiresIn": 3600,
    }
    mock_service_class.return_value = mock_service

  @patch("api.v1.interviews.views.playback_url_view.GeneratePlaybackUrlService")
  def test_playback_url_returns_presigned_url_for_completed(self, mock_service_class):
    """업로드 완료 직후 (COMPLETED) 재생 URL 발급."""
    self._mock_service(mock_service_class)
    SubscriptionFactory(user=self.user, pro=True)
    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.COMPLETED
    )

    response = self.client.get(f"{BASE}/recordings/{recording.uuid}/playback-url/")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["url"], "https://playback.example.com")

  @patch("api.v1.interviews.views.playback_url_view.GeneratePlaybackUrlService")
  def test_playback_url_returns_presigned_url_for_processing(self, mock_service_class):
    """후처리 중 (PROCESSING) 에도 원본 영상은 재생 가능."""
    self._mock_service(mock_service_class)
    SubscriptionFactory(user=self.user, pro=True)
    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.PROCESSING
    )

    response = self.client.get(f"{BASE}/recordings/{recording.uuid}/playback-url/")

    self.assertEqual(response.status_code, status.HTTP_200_OK)

  @patch("api.v1.interviews.views.playback_url_view.GeneratePlaybackUrlService")
  def test_playback_url_returns_presigned_url_for_ready(self, mock_service_class):
    """후처리 완료 (READY) 시 재생 가능."""
    self._mock_service(mock_service_class)
    SubscriptionFactory(user=self.user, pro=True)
    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.READY
    )

    response = self.client.get(f"{BASE}/recordings/{recording.uuid}/playback-url/")

    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_playback_url_returns_409_for_uploading(self):
    """업로드 진행 중 (UPLOADING) 에는 재생 불가."""
    SubscriptionFactory(user=self.user, pro=True)
    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.UPLOADING
    )

    response = self.client.get(f"{BASE}/recordings/{recording.uuid}/playback-url/")

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

  def test_playback_url_returns_409_for_failed(self):
    """실패한 녹화 (FAILED) 는 재생 불가."""
    SubscriptionFactory(user=self.user, pro=True)
    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.FAILED
    )

    response = self.client.get(f"{BASE}/recordings/{recording.uuid}/playback-url/")

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

  def test_playback_url_free_plan_returns_403(self):
    """Free 플랜 사용자는 영상 재생 권한 없음."""
    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.COMPLETED
    )

    response = self.client.get(f"{BASE}/recordings/{recording.uuid}/playback-url/")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
