import uuid as uuid_mod
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


class PresignPartViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  @patch("api.v1.interviews.views.presign_part_view.get_video_s3_presign_client")
  def test_presign_part_returns_presigned_url(self, mock_get_client):
    mock_s3 = MagicMock()
    mock_get_client.return_value = mock_s3
    mock_s3.generate_presigned_url.return_value = "https://presigned.example.com"

    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    url = f"{BASE}/recordings/{recording.pk}/presign-part/?part_number=1"
    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn("presignedUrl", response.data)
    self.assertEqual(response.data["presignedUrl"], "https://presigned.example.com")
    self.assertEqual(response.data["partNumber"], 1)

  def test_presign_part_missing_part_number_returns_400(self):
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    url = f"{BASE}/recordings/{recording.pk}/presign-part/"
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_presign_part_invalid_part_number_returns_400(self):
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    url = f"{BASE}/recordings/{recording.pk}/presign-part/?part_number=abc"
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_presign_part_not_found_returns_404(self):
    url = f"{BASE}/recordings/{uuid_mod.uuid4()}/presign-part/?part_number=1"
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  @patch("api.v1.interviews.views.presign_part_view.get_video_s3_presign_client")
  def test_presign_part_completed_recording_returns_409(self, mock_get_client):
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.COMPLETED,
    )

    url = f"{BASE}/recordings/{recording.pk}/presign-part/?part_number=1"
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

  def test_presign_part_requires_auth(self):
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    unauth_client = APIClient()
    url = f"{BASE}/recordings/{recording.pk}/presign-part/?part_number=1"
    response = unauth_client.get(url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
